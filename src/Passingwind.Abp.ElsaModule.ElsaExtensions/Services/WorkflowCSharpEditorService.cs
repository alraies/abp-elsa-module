﻿using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Elsa.Models;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Completion;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Formatting;
using Microsoft.CodeAnalysis.Shared.Extensions;
using Microsoft.CodeAnalysis.Text;
using Microsoft.Extensions.Logging;
using Passingwind.Abp.ElsaModule.CSharp;
using Passingwind.Abp.ElsaModule.Roslyn;
using Passingwind.Abp.ElsaModule.Scripting.CSharp;

namespace Passingwind.Abp.ElsaModule.Services;

public class WorkflowCSharpEditorService : IWorkflowCSharpEditorService
{
    private const string _generatedTypeClassName = "GeneratedTypes";

    private readonly ILogger<WorkflowCSharpEditorService> _logger;
    private readonly IRoslynHost _roslynHost;
    private readonly ICSharpTypeDefinitionService _cSharpTypeDefinitionService;

    public WorkflowCSharpEditorService(ILogger<WorkflowCSharpEditorService> logger, IRoslynHost roslynHost, ICSharpTypeDefinitionService cSharpTypeDefinitionService)
    {
        _logger = logger;
        _roslynHost = roslynHost;
        _cSharpTypeDefinitionService = cSharpTypeDefinitionService;
    }

    public async Task<WorkflowCSharpEditorCodeAnalysisResult> GetCodeAnalysisAsync(WorkflowDefinition workflowDefinition, string textId, string text, CancellationToken cancellationToken = default)
    {
        var generated = await _cSharpTypeDefinitionService.GenerateAsync(workflowDefinition, cancellationToken);

        // one workflow to on adhoc project
        var project = _roslynHost.GetOrCreateProject(workflowDefinition.DefinitionId.Replace("-", null), generated.Assemblies, generated.Imports);

        _roslynHost.CreateOrUpdateDocument(project.Name, _generatedTypeClassName, generated.Text);
        _roslynHost.CreateOrUpdateDocument(project.Name, textId, text, true);

        var diagnostics = await _roslynHost.GetDocumentDiagnosticsAsync(project.Name, textId, cancellationToken);

        var result = new List<WorkflowCSharpEditorCodeAnalysis>();

        foreach (var diagnostic in diagnostics)
        {
            var severity = MapDiagnosticSeverity(diagnostic);

            var msg = new WorkflowCSharpEditorCodeAnalysis()
            {
                Id = diagnostic.Id,
                Message = diagnostic.GetMessage(),
                OffsetFrom = diagnostic.Location.SourceSpan.Start,
                OffsetTo = diagnostic.Location.SourceSpan.End,
                Severity = severity,
                SeverityNumeric = (int)severity,
            };
            result.Add(msg);
        }
        return new WorkflowCSharpEditorCodeAnalysisResult() { Items = result };
    }

    public async Task<WorkflowCSharpEditorFormatterResult> CodeFormatterAsync(string textId, string text, CancellationToken cancellationToken = default)
    {
        var project = _roslynHost.GetOrCreateProject(Guid.NewGuid().ToString());
        var documentId = _roslynHost.CreateOrUpdateDocument(project.Name, textId, text, true);
        var document = _roslynHost.GetDocument(project.Name, documentId);

        var formattedDocument = await Formatter.FormatAsync(document);
        var sourceText = await formattedDocument.GetTextAsync(cancellationToken);

        _roslynHost.DeleteProject(project.Name);

        return new WorkflowCSharpEditorFormatterResult
        {
            Text = sourceText?.ToString()
        };
    }

    public async Task<WorkflowCSharpEditorCompletionResult> GetCompletionAsync(WorkflowDefinition workflowDefinition, string textId, string text, int position, CancellationToken cancellationToken = default)
    {
        var generated = await _cSharpTypeDefinitionService.GenerateAsync(workflowDefinition, cancellationToken);

        var project = _roslynHost.GetOrCreateProject(workflowDefinition.DefinitionId.Replace("-", null), generated.Assemblies, generated.Imports);

        _ = _roslynHost.CreateOrUpdateDocument(project.Name, _generatedTypeClassName, generated.Text);
        var documentId = _roslynHost.CreateOrUpdateDocument(project.Name, textId, text, true);

        await _roslynHost.AnalysisProjectAsync(project.Name, cancellationToken);

        var document = _roslynHost.GetDocument(project.Name, documentId);

        var completionService = CompletionService.GetService(document);
        var helper = Microsoft.CodeAnalysis.Completion.CompletionHelper.GetHelper(document);

        if (completionService == null)
        {
            return new WorkflowCSharpEditorCompletionResult();
        }

        var sourceText = await document.GetTextAsync(cancellationToken);

        CompletionTrigger completionTrigger = CompletionTrigger.Invoke;
        var triggerText = sourceText.GetSubText(position <= 0 ? 0 : position - 1)?.ToString();
        if (triggerText.Length > 0)
        {
            if (triggerText[0] != '.')
                completionTrigger = CompletionTrigger.CreateInsertionTrigger(triggerText[0]);
        }

        var completionResult = await completionService.GetCompletionsAsync(document, position, completionTrigger, cancellationToken: cancellationToken);

        var results = new List<WorkflowCSharpEditorCompletionItem>();

        if (!completionResult.IsEmpty)
        {
            var textSpanToTextCache = new Dictionary<TextSpan, string>();

            var completions = completionResult.ItemsList.Where(x =>
            {
                if (!textSpanToTextCache.TryGetValue(x.Span, out var spanTxt))
                {
                    spanTxt = textSpanToTextCache[x.Span] = sourceText.GetSubText(x.Span).ToString();
                }

                return helper.MatchesPattern(x, spanTxt, CultureInfo.InvariantCulture);
            });

            foreach (var item in completions)
            {
                SymbolKind symbolKind = SymbolKind.Local;
                if (item.Properties.TryGetValue(nameof(SymbolKind), out var kindValue))
                {
                    symbolKind = Enum.Parse<SymbolKind>(kindValue);
                }

                var completionDescription = await completionService.GetDescriptionAsync(document, item, cancellationToken);

                results.Add(new WorkflowCSharpEditorCompletionItem
                {
                    Description = completionDescription.Text,
                    Suggestion = item.DisplayText,
                    SymbolKind = symbolKind.ToString(),
                    ItemKind = MapKind(symbolKind),
                });
            }
        }

        return new WorkflowCSharpEditorCompletionResult(results);

        WorkflowCSharpEditorCompletionItemKind MapKind(SymbolKind symbolKind)
        {
            switch (symbolKind)
            {
                case SymbolKind.Field:
                    {
                        return WorkflowCSharpEditorCompletionItemKind.Field;
                    }

                case SymbolKind.Property:
                    {
                        return WorkflowCSharpEditorCompletionItemKind.Property;
                    }

                case SymbolKind.Local:
                    {
                        return WorkflowCSharpEditorCompletionItemKind.Variable;
                    }

                case SymbolKind.Method:
                    {
                        return WorkflowCSharpEditorCompletionItemKind.Function;
                    }

                case SymbolKind.NamedType:
                    {
                        return WorkflowCSharpEditorCompletionItemKind.Class;
                    }

                default:
                    {
                        return WorkflowCSharpEditorCompletionItemKind.Others;
                    }
            }
        }
    }

    public async Task<WorkflowCSharpEditorHoverInfoResult> GetHoverInfoAsync(WorkflowDefinition workflowDefinition, string textId, string text, int position, CancellationToken cancellationToken = default)
    {
        var generated = await _cSharpTypeDefinitionService.GenerateAsync(workflowDefinition, cancellationToken);

        var project = _roslynHost.GetOrCreateProject(workflowDefinition.DefinitionId.Replace("-", null), generated.Assemblies, generated.Imports);

        _ = _roslynHost.CreateOrUpdateDocument(project.Name, _generatedTypeClassName, generated.Text);
        var documentId = _roslynHost.CreateOrUpdateDocument(project.Name, textId, text, true);

        var document = _roslynHost.GetDocument(project.Name, documentId);

        var compilation = await _roslynHost.GetCompilationAsync(project.Name, cancellationToken);

        var syntaxTree = await document.GetSyntaxTreeAsync(cancellationToken);
        var semanticModel = compilation.GetSemanticModel(syntaxTree, true);

        var syntaxRoot = await document.GetSyntaxRootAsync(cancellationToken);
        var expressionNode = syntaxRoot.FindToken(position).Parent;

        TypeInfo typeInfo;
        if (expressionNode is VariableDeclaratorSyntax)
        {
            SyntaxNode childNode = expressionNode.ChildNodes()?.FirstOrDefault()?.ChildNodes()?.FirstOrDefault();
            if (childNode != null)
            {
                typeInfo = semanticModel.GetTypeInfo(childNode);
                var location = expressionNode.GetLocation();
                if (typeInfo.Type != null)
                    return new WorkflowCSharpEditorHoverInfoResult()
                    {
                        Information = typeInfo.Type.ToString(),
                        OffsetFrom = location.SourceSpan.Start,
                        OffsetTo = location.SourceSpan.End
                    };
            }
        }

        if (expressionNode is PropertyDeclarationSyntax prop)
        {
            var location = expressionNode.GetLocation();
            return new WorkflowCSharpEditorHoverInfoResult()
            {
                Information = prop.Type.ToString(),
                OffsetFrom = location.SourceSpan.Start,
                OffsetTo = location.SourceSpan.End
            };
        }

        if (expressionNode is ParameterSyntax p)
        {
            var location = expressionNode.GetLocation();
            return new WorkflowCSharpEditorHoverInfoResult()
            {
                Information = p.Type.ToString(),
                OffsetFrom = location.SourceSpan.Start,
                OffsetTo = location.SourceSpan.End
            };
        }

        if (expressionNode is IdentifierNameSyntax i)
        {
            var location = expressionNode.GetLocation();
            typeInfo = semanticModel.GetTypeInfo(i);
            if (typeInfo.Type != null)
                return new WorkflowCSharpEditorHoverInfoResult()
                {
                    Information = typeInfo.Type.ToString(),
                    OffsetFrom = location.SourceSpan.Start,
                    OffsetTo = location.SourceSpan.End
                };
        }

        var symbolInfo = semanticModel.GetSymbolInfo(expressionNode);
        if (symbolInfo.Symbol != null)
        {
            var location = expressionNode.GetLocation();
            return new WorkflowCSharpEditorHoverInfoResult()
            {
                Information = HoverInfoBuild(symbolInfo),
                OffsetFrom = location.SourceSpan.Start,
                OffsetTo = location.SourceSpan.End
            };
        }

        return null;
    }

    public async Task<WorkflowCSharpEditorSignatureResult> GetSignaturesAsync(WorkflowDefinition workflowDefinition, string textId, string text, int position, CancellationToken cancellationToken = default)
    {
        var generated = await _cSharpTypeDefinitionService.GenerateAsync(workflowDefinition, cancellationToken);

        var project = _roslynHost.GetOrCreateProject(workflowDefinition.DefinitionId.Replace("-", null), generated.Assemblies, generated.Imports);

        _ = _roslynHost.CreateOrUpdateDocument(project.Name, _generatedTypeClassName, generated.Text);
        var documentId = _roslynHost.CreateOrUpdateDocument(project.Name, textId, text, true);

        var document = _roslynHost.GetDocument(project.Name, documentId);

        var compilation = await _roslynHost.GetCompilationAsync(project.Name, cancellationToken);

        var syntaxTree = await document.GetSyntaxTreeAsync();
        var semanticModel = compilation.GetSemanticModel(syntaxTree, true);

        var invocation = await InvocationContext.GetInvocation(document, position);
        if (invocation == null) return null;

        int activeParameter = 0;
        foreach (var comma in invocation.Separators)
        {
            if (comma.Span.Start > invocation.Position)
                break;

            activeParameter += 1;
        }

        var signaturesSet = new HashSet<MonacoSignatures>();
        var bestScore = int.MinValue;
        MonacoSignatures bestScoredItem = null;

        var types = invocation.ArgumentTypes;
        ISymbol throughSymbol = null;
        ISymbol throughType = null;
        var methodGroup = invocation.SemanticModel.GetMemberGroup(invocation.Receiver).OfType<IMethodSymbol>();
        if (invocation.Receiver is MemberAccessExpressionSyntax)
        {
            var throughExpression = ((MemberAccessExpressionSyntax)invocation.Receiver).Expression;
            var typeInfo = semanticModel.GetTypeInfo(throughExpression);
            throughSymbol = invocation.SemanticModel.GetSpeculativeSymbolInfo(invocation.Position, throughExpression, SpeculativeBindingOption.BindAsExpression).Symbol;
            throughType = invocation.SemanticModel.GetSpeculativeTypeInfo(invocation.Position, throughExpression, SpeculativeBindingOption.BindAsTypeOrNamespace).Type;
            var includeInstance = throughSymbol != null && !(throughSymbol is ITypeSymbol) ||
                throughExpression is LiteralExpressionSyntax ||
                throughExpression is TypeOfExpressionSyntax;
            var includeStatic = throughSymbol is INamedTypeSymbol || throughType != null;
            if (throughType == null)
            {
                throughType = typeInfo.Type;
                includeInstance = true;
            }
            methodGroup = methodGroup.Where(m => m.IsStatic && includeStatic || !m.IsStatic && includeInstance);
        }
        else if (invocation.Receiver is SimpleNameSyntax && invocation.IsInStaticContext)
        {
            methodGroup = methodGroup.Where(m => m.IsStatic || m.MethodKind == MethodKind.LocalFunction);
        }

        foreach (var methodOverload in methodGroup)
        {
            var signature = BuildSignature(methodOverload);
            signaturesSet.Add(signature);

            var score = InvocationScore(methodOverload, types);
            if (score > bestScore)
            {
                bestScore = score;
                bestScoredItem = signature;
            }
        }

        return new WorkflowCSharpEditorSignatureResult()
        {
            Signatures = signaturesSet.ToArray(),
            ActiveParameter = activeParameter,
            ActiveSignature = Array.IndexOf(signaturesSet.ToArray(), bestScoredItem)
        };
    }

    private static WorkflowCSharpEditorCodeAnalysisSeverity MapDiagnosticSeverity(Diagnostic diagnostic)
    {
        return diagnostic.Severity switch
        {
            DiagnosticSeverity.Error => WorkflowCSharpEditorCodeAnalysisSeverity.Error,
            DiagnosticSeverity.Warning => WorkflowCSharpEditorCodeAnalysisSeverity.Warning,
            DiagnosticSeverity.Info => WorkflowCSharpEditorCodeAnalysisSeverity.Info,
            _ => WorkflowCSharpEditorCodeAnalysisSeverity.Hint
        };
    }

    private static string HoverInfoBuild(SymbolInfo symbolInfo)
    {
        if (symbolInfo.Symbol is IMethodSymbol methodsymbol)
        {
            var sb = new StringBuilder().Append("(method) ").Append(methodsymbol.DeclaredAccessibility.ToString().ToLower()).Append(' ');
            if (methodsymbol.IsStatic)
                sb.Append("static").Append(' ');
            sb.Append(methodsymbol.Name).Append('(');
            for (var i = 0; i < methodsymbol.Parameters.Length; i++)
            {
                sb.Append(methodsymbol.Parameters[i].Type).Append(' ').Append(methodsymbol.Parameters[i].Name);
                if (i < methodsymbol.Parameters.Length - 1) sb.Append(", ");
            }
            sb.Append(") : ");
            sb.Append(methodsymbol.ReturnType).ToString();
            return sb.ToString();
        }
        if (symbolInfo.Symbol is ILocalSymbol localsymbol)
        {
            var sb = new StringBuilder().Append(localsymbol.Name).Append(" : ");
            if (localsymbol.IsConst)
                sb.Append("const").Append(' ');
            sb.Append(localsymbol.Type);
            return sb.ToString();
        }
        if (symbolInfo.Symbol is IFieldSymbol fieldSymbol)
        {
            var sb = new StringBuilder().Append(fieldSymbol.Name).Append(" : ").Append(fieldSymbol.DeclaredAccessibility.ToString().ToLower()).Append(' ');
            if (fieldSymbol.IsStatic)
                sb.Append("static").Append(' ');
            if (fieldSymbol.IsReadOnly)
                sb.Append("readonly").Append(' ');
            if (fieldSymbol.IsConst)
                sb.Append("const").Append(' ');
            sb.Append(fieldSymbol.Type).ToString();
            return sb.ToString();
        }

        return string.Empty;
    }

    private static MonacoSignatures BuildSignature(IMethodSymbol symbol)
    {
        var parameters = new List<MonacoSignatureParameter>();
        foreach (var parameter in symbol.Parameters)
        {
            parameters.Add(new MonacoSignatureParameter() { Label = parameter.ToDisplayString(SymbolDisplayFormat.MinimallyQualifiedFormat) });
        };
        var signature = new MonacoSignatures
        {
            Documentation = symbol.GetDocumentationCommentXml(),
            Label = symbol.ToDisplayString(SymbolDisplayFormat.MinimallyQualifiedFormat),
            Parameters = parameters.ToArray()
        };

        return signature;
    }

    private int InvocationScore(IMethodSymbol symbol, IEnumerable<TypeInfo> types)
    {
        var parameters = symbol.Parameters;
        if (parameters.Count() < types.Count())
            return int.MinValue;

        var score = 0;
        var invocationEnum = types.GetEnumerator();
        var definitionEnum = parameters.GetEnumerator();
        while (invocationEnum.MoveNext() && definitionEnum.MoveNext())
        {
            if (invocationEnum.Current.ConvertedType == null)
                score += 1;
            else if (SymbolEqualityComparer.Default.Equals(invocationEnum.Current.ConvertedType, definitionEnum.Current.Type))
                score += 2;
        }
        return score;
    }

    public class InvocationContext
    {
        public static async Task<InvocationContext> GetInvocation(Document document, int position)
        {
            var sourceText = await document.GetTextAsync();
            var tree = await document.GetSyntaxTreeAsync();
            var root = await tree.GetRootAsync();
            var node = root.FindToken(position).Parent;

            while (node != null)
            {
                if (node is InvocationExpressionSyntax invocation && invocation.ArgumentList.Span.Contains(position))
                {
                    var semanticModel = await document.GetSemanticModelAsync();
                    return new InvocationContext(semanticModel, position, invocation.Expression, invocation.ArgumentList);
                }

                if (node is BaseObjectCreationExpressionSyntax objectCreation && (objectCreation.ArgumentList?.Span.Contains(position) ?? false))
                {
                    var semanticModel = await document.GetSemanticModelAsync();
                    return new InvocationContext(semanticModel, position, objectCreation, objectCreation.ArgumentList);
                }

                if (node is AttributeSyntax attributeSyntax && (attributeSyntax.ArgumentList?.Span.Contains(position) ?? false))
                {
                    var semanticModel = await document.GetSemanticModelAsync();
                    return new InvocationContext(semanticModel, position, attributeSyntax, attributeSyntax.ArgumentList);
                }

                node = node.Parent;
            }

            return null;
        }

        public SemanticModel SemanticModel { get; }
        public int Position { get; }
        public SyntaxNode Receiver { get; }
        public IEnumerable<TypeInfo> ArgumentTypes { get; }
        public IEnumerable<SyntaxToken> Separators { get; }
        public bool IsInStaticContext { get; }

        public InvocationContext(SemanticModel semModel, int position, SyntaxNode receiver, ArgumentListSyntax argList)
        {
            SemanticModel = semModel;
            Position = position;
            Receiver = receiver;
            ArgumentTypes = argList.Arguments.Select(argument => semModel.GetTypeInfo(argument.Expression));
            Separators = argList.Arguments.GetSeparators();
        }

        public InvocationContext(SemanticModel semModel, int position, SyntaxNode receiver, AttributeArgumentListSyntax argList)
        {
            SemanticModel = semModel;
            Position = position;
            Receiver = receiver;
            ArgumentTypes = argList.Arguments.Select(argument => semModel.GetTypeInfo(argument.Expression));
            Separators = argList.Arguments.GetSeparators();
        }
    }
}
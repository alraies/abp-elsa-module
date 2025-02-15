import MonacoEditor from '@/components/MonacoEditor';
import { getWorkflowStorageProviders } from '@/services/Workflow';
import {
    createWorkflowDefinition,
    deleteWorkflowDefinitionVersion,
    getWorkflowDefinition,
    getWorkflowDefinitionPreviousVersion,
    getWorkflowDefinitionVersion,
    getWorkflowDefinitionVersions,
    updateWorkflowDefinition,
} from '@/services/WorkflowDefinition';
import { WorkflowCSharpEditorCompletionItemKind } from '@/services/enums';
import type { API } from '@/services/typings';
import { showDownloadJsonFile } from '@/services/utils';
import { GlobalOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { ProFormSwitch, ProFormUploadDragger } from '@ant-design/pro-components';
import ProForm, { ModalForm, ProFormSelect } from '@ant-design/pro-form';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { DagreLayout } from '@antv/layout';
import type { Edge, Graph, Node } from '@antv/x6';
import { DiffEditor } from '@monaco-editor/react';
import { Button, Card, Dropdown, Modal, Popconfirm, Space, Spin, Tag, message } from 'antd';
import type { RcFile } from 'antd/lib/upload';
import { Validator } from 'jsonschema';
import { isArray } from 'lodash';
import * as monaco from 'monaco-editor';
import { setDiagnosticsOptions } from 'monaco-yaml';
import React, { useEffect, useRef, useState } from 'react';
import { formatMessage, useAccess, useHistory, useIntl, useLocation } from 'umi';
import YAML from 'yaml';
import EditFormItems from '../definition/edit-form-items';
import VariableForm from '../definition/variableForm';
import definitionJsonSchema from './definition-json-schema';
import type { FlowActionType } from './flow';
import Flow from './flow';
import './index.less';
import NodePropForm from './node-prop-form';
import {
    conventToGraphData,
    conventToServerData,
    getCSharpEditorLanguageProvider,
    getJavascriptEditorDefinitonsContent,
    getNodeOutcomes,
    getNodeTypeRawData,
    getPropertySyntaxes,
    propertyExpressionSyntaxeCompatibleKeys,
} from './service';
import type {
    EdgeEditFormData,
    IGraphData,
    NodeEditFormData,
    NodeTypeProperty,
    NodeUpdateData,
} from './type';

let codeAnalysisTimer = 0;

const Index: React.FC = () => {
    const location = useLocation();
    const history = useHistory();
    const access = useAccess();

    const intl = useIntl();

    const flowAction = useRef<FlowActionType>();

    const [loading, setLoading] = React.useState(false);

    const [fromDefinition, setFromDefinition] = React.useState<{ id: string; version: number }>();

    const [storageProviders, setStorageProviders] = React.useState<any[]>([]);

    const [submiting, setSubmiting] = React.useState(false);
    //
    const [definitionId, setDefinitionId] = React.useState<string>();
    const [version, setVersion] = React.useState<number>(1);
    const [definition, setDefinition] = React.useState<API.WorkflowDefinition>();
    const [definitionVersion, setDefinitionVersion] =
        React.useState<API.WorkflowDefinitionVersion>();

    const [oldVersion, setOldVersion] = React.useState<number>();

    const [graphData, setGraphData] = React.useState<IGraphData>();

    const [editModalTitle, setEditModalTitle] = React.useState<string>();
    const [editModalVisible, setEditModalVisible] = React.useState<boolean>(false);

    const [nodeTypePropFormTitle, setNodeTypePropFormTitle] = React.useState<React.ReactNode>('');
    const [nodeTypePropFormVisible, setNodeTypePropFormVisible] = React.useState<boolean>(false);
    const [nodeTypePropInputList, setNodeTypePropInputList] = React.useState<NodeTypeProperty[]>(
        [],
    );
    const [nodeTypePropOutputList, setNodeTypePropOutputList] = React.useState<NodeTypeProperty[]>(
        [],
    );
    const [nodeTypeDescriptor, setNodeTypeDescriptor] =
        React.useState<API.ActivityTypeDescriptor>();
    const [nodePropertySyntaxs, setNodePropertySyntaxs] =
        React.useState<Record<string, string[]>>();

    const [editNodeId, setEditNodeId] = React.useState<string>('');
    const [editNodeFormData, setEditNodeFormData] = React.useState<NodeEditFormData>();
    const [editNodeFormRef] = ProForm.useForm();

    const [editForm] = ProForm.useForm();

    const [versionListModalVisible, setVersionListModalVisible] = React.useState<boolean>(false);

    const [versionDiffModalTitle, setVersionDiffModalTitle] = React.useState<string>('Diff');
    const [versionDiffModalVisible, setVersionDiffModalVisible] = React.useState<boolean>(false);
    const [versionDiffData, setVersionDiffData] =
        React.useState<{ source: string; target: string }>();

    const [jsonEditorVisible, setJsonEditorVisible] = React.useState<boolean>(false);
    const [jsonEditorValue, setJsonEditorValue] = React.useState<string>('');

    const [importModalVisible, setImportModalVisible] = React.useState<boolean>(false);

    const [edgeOutcomeChangeModalVisible, setEdgeOutcomeChangeModalVisible] = useState(false);
    const [edgeOutcomFormData, setEdgeOutcomFormData] = useState<EdgeEditFormData>();

    const [autoSaveEnabled, setAutoSaveEnabled] = React.useState<boolean>(false);

    const [variableEditModalVisible, setVariableEditModalVisible] = React.useState<boolean>();
    const [variableData, setVariableData] = React.useState<any>();

    const loadServerData = async (
        definiton: API.WorkflowDefinitionVersion,
        autoLayout: boolean = false,
    ) => {
        const gData = await conventToGraphData(definiton.activities!, definiton.connections!);

        // if (item.sourceActivityId) sourceId = item.sourceActivityId;
        // if (item.targetActivityId) targetId = item.targetActivityId;

        // if (item.source) sourceId = item.source;
        // if (item.target) targetId = item.target;

        if (autoLayout) {
            const layout = new DagreLayout({
                type: 'dagre',
                rankdir: 'TB',
                nodesep: 60,
                ranksep: 40,
            });

            // @ts-ignore
            const newModel = layout.layout(gData);
            // @ts-ignore
            setGraphData(newModel);
        } else {
            setGraphData(gData);
        }
    };

    const handleOnExport = async () => {
        if (!definition) return;
        const loading2 = message.loading(intl.formatMessage({ id: 'common.dict.loading' }));
        const result = await flowAction.current?.getGraphData();
        if (result) {
            const result2 = conventToServerData(result);
            showDownloadJsonFile(
                `${definition.name}-${version}.json`,
                JSON.stringify(
                    {
                        ...result2,
                        ...definition,
                    },
                    null,
                    2,
                ),
            );

            loading2();
        } else {
            message.error('Get graph data failed');
        }
    };

    const handleOnImport = async (file: RcFile, autoLayout: boolean = true) => {
        const loading2 = message.loading(intl.formatMessage({ id: 'common.dict.loading' }));
        try {
            const content = await file.text();
            const data = JSON.parse(content);
            const data2 = { connections: [], activities: data.activities };
            // compatible with offlice export json file
            if (data?.connections) {
                data2.connections = data.connections?.map((x: any) => {
                    return {
                        sourceId: x.sourceId ?? x.sourceActivityId,
                        targetId: x.targetId ?? x.targetActivityId,
                        outcome: x.outcome,
                    };
                });
            }

            await loadServerData(data2 as API.WorkflowDefinition, autoLayout);
            message.info('import successful.');

            //
            return true;
        } catch (error) {
            console.error(error);
            message.error('Import file failed');
            //
            return false;
        }
    };

    // show node edit form
    // 显示节点属性编辑表单
    const handleShowNodeEditForm = async (nodeConfig: Node.Properties, node: Node) => {
        const loading2 = message.loading(intl.formatMessage({ id: 'common.dict.loading' }));
        //
        setNodeTypePropFormTitle(
            <Space>
                {intl.formatMessage({ id: 'page.designer.settings.title' })}
                <span>{` - ${node.data.label ?? ''}`}</span>
                <Tag>{nodeConfig.type}</Tag>
            </Space>,
        );

        setEditNodeId(node.id);

        // load node type & peoperties
        const allNodeTypes = await getNodeTypeRawData();
        const nodeType = allNodeTypes.items?.find((x) => x.type == nodeConfig.type);

        if (!nodeType) {
            message.error(`The node type '${nodeConfig.type}' not found.`);
            return;
        }

        setNodeTypeDescriptor(nodeType);

        const inputPropItems = (nodeType.inputProperties ?? [])
            .filter((x) => x.isBrowsable)
            .map((x) => {
                return {
                    ...x,
                    isRequired: x.isDesignerCritical,
                } as NodeTypeProperty;
            });

        const outputPropItems = (nodeType.outputProperties ?? [])
            .filter((x) => x.isBrowsable)
            .map((x) => {
                return {
                    ...x,
                } as NodeTypeProperty;
            });

        // save to status
        setNodeTypePropInputList(inputPropItems ?? []);
        setNodeTypePropOutputList(outputPropItems ?? []);

        // build node edit data
        const originData = node.getData() ?? {};
        // clear origin
        delete originData.propertyStorageProviders?.$id;
        delete originData.propertyStorageProviders?.$type;
        delete originData.props?.$id;
        delete originData.props?.$type;
        delete originData.$id;
        delete originData.$type;
        //
        const formData: NodeEditFormData = {
            ...originData,
            id: node.id ?? '',
            displayName: node.data.label, // to displayname
            // new
            props: {},
        };

        // initial all form fields
        const propertySyntaxs = {};
        inputPropItems?.forEach((propItem) => {
            //
            const propSyntax = getPropertySyntaxes(propItem);
            propertySyntaxs[propItem.name] = propSyntax.supports;
            const defaultSyntax = propSyntax.default;
            //
            const defaultValue: string | object | number | undefined =
                propItem.defaultValue ?? undefined;
            let syntaxStringValue: string = '';
            if (defaultValue) {
                if (typeof defaultValue == 'object') {
                    syntaxStringValue = JSON.stringify(defaultValue);
                } else if (defaultValue) {
                    syntaxStringValue = defaultValue?.toString();
                } else {
                    syntaxStringValue = '';
                }
            }

            if (defaultSyntax)
                formData.props[propItem.name] = {
                    syntax: 'Default',
                    value: defaultValue,
                    expressions: {
                        Default: defaultValue,
                        [defaultSyntax]: syntaxStringValue,
                    },
                };

            if (propSyntax.editor) {
                formData.props[propItem.name] = {
                    syntax: propSyntax.editor,
                    value: defaultValue,
                    noSyntax: true, // special case
                    expressions: {
                        Literal: syntaxStringValue,
                    },
                };
            }

            //
            if (
                propItem.defaultWorkflowStorageProvider &&
                Object.keys(formData.propertyStorageProviders ?? {}).indexOf(propItem.name) == -1
            ) {
                formData.propertyStorageProviders[propItem.name] =
                    propItem.defaultWorkflowStorageProvider;
            }
        });

        outputPropItems.forEach((propItem) => {
            //
            if (
                propItem.defaultWorkflowStorageProvider &&
                Object.keys(formData.propertyStorageProviders ?? {}).indexOf(propItem.name) == -1
            ) {
                formData.propertyStorageProviders[propItem.name] =
                    propItem.defaultWorkflowStorageProvider;
            }
        });

        setNodePropertySyntaxs(propertySyntaxs);

        // property
        const sourceProperties = formData.properties ?? [];

        // load form data and overwrite
        sourceProperties.forEach((item) => {
            const syntax = !item.syntax ? 'Default' : item.syntax;
            const expressions = item.expressions ?? {};
            delete expressions.$id;
            delete expressions.$type;
            let syntaxValue: any = undefined;
            let expressionValue: string = expressions?.[syntax] ?? '';

            // load syntax value
            let currentSyntax = syntax;
            // if syntax not found, use fist key in expressions
            if (
                Object.keys(expressions).indexOf(syntax) == -1 &&
                Object.keys(expressions).length > 0
            ) {
                const foundSyntax = Object.keys(expressions)[0];
                expressionValue = expressions![foundSyntax];
                //
                currentSyntax = propertyExpressionSyntaxeCompatibleKeys[foundSyntax] ?? foundSyntax;
            }

            if (syntax == 'Default') {
                const property = nodeType.inputProperties?.find((x) => x.name == item.name);
                // default
                syntaxValue = expressionValue;
                //
                if (property?.uiHint == 'check-list' || property?.uiHint == 'multi-text') {
                    if (
                        (expressionValue.startsWith('{') && expressionValue.endsWith('}')) ||
                        (expressionValue.startsWith('[') && expressionValue.endsWith(']'))
                    ) {
                        syntaxValue = JSON.parse(expressionValue);
                    }
                }
            }

            const propData = formData.props[item.name] ?? {};
            const propExpressions = propData?.expressions ?? {};
            if (propData.noSyntax) {
                formData.props[item.name] = {
                    ...propData,
                    expressions: {
                        ...propExpressions,
                        Default: syntaxValue,
                        [currentSyntax]: expressionValue,
                        Literal: expressionValue,
                    },
                };
            } else {
                formData.props[item.name] = {
                    ...propData,
                    syntax: syntax,
                    expressions: {
                        ...propExpressions,
                        Default: syntaxValue,
                        [currentSyntax]: expressionValue,
                    },
                };
            }
        });

        setEditNodeFormData(formData);

        console.debug('load form data: ', formData);

        // force update form value
        editNodeFormRef.resetFields();
        editNodeFormRef.setFieldsValue(formData);

        // show
        setNodeTypePropFormVisible(true);
        loading2();
    };

    // handle on node edit form submit
    // 更新节点数据
    const handleSaveNodeEditForm = async (formData: NodeEditFormData) => {
        console.debug('save form data: ', formData);
        const result: NodeUpdateData = {
            ...formData,
            name: formData.name,
            label: formData.displayName, // to label
            properties: [], // overwrite
            outcomes: [], // overwrite
        };

        // update properties
        if (formData.props) {
            // as default, one syntax map one expressions key value
            // if not, use expressions first key as syntax and use expressions first value as value
            // if syntax is default, use expressions first key as syntax
            for (const name in formData.props ?? {}) {
                const curObj = formData.props[name];
                //
                let valueSyntaxName = curObj.syntax;
                let syntaxSourceValue: any = undefined;
                let sytaxStringValue: string = '';
                const expressions = curObj.expressions ?? {};
                // remove
                delete expressions.$id;
                delete expressions.$type;

                const syntaxes = nodePropertySyntaxs![name];
                //
                if (curObj.expressions && Object.keys(expressions).length > 0) {
                    if (curObj.syntax == 'Default' && syntaxes.length > 0) {
                        valueSyntaxName = syntaxes[0];
                        syntaxSourceValue = curObj.expressions?.[curObj.syntax] ?? undefined;
                    } else {
                        syntaxSourceValue = curObj.expressions?.[valueSyntaxName] ?? undefined;
                    }
                    // special case
                    if (Object.keys(expressions).indexOf(curObj.syntax) == -1) {
                        // first key value
                        valueSyntaxName = Object.keys(expressions)[0];
                        syntaxSourceValue = curObj.expressions?.[valueSyntaxName] ?? undefined;
                    }

                    // server save value as string
                    if (syntaxSourceValue) {
                        if (typeof syntaxSourceValue == 'object')
                            sytaxStringValue = JSON.stringify(syntaxSourceValue);
                        else if (typeof syntaxSourceValue != 'string')
                            sytaxStringValue = syntaxSourceValue.toString();
                        else {
                            sytaxStringValue = syntaxSourceValue as string;
                        }
                    }

                    // end
                    const propItem = {
                        name: name,
                        syntax:
                            curObj.syntax == 'Default'
                                ? undefined
                                : curObj.syntax == valueSyntaxName
                                ? valueSyntaxName
                                : undefined,
                        expressions: { [valueSyntaxName]: sytaxStringValue },
                        value: syntaxSourceValue,
                    };
                    // clear value
                    if (!sytaxStringValue) {
                        propItem.expressions = {};
                    }
                    result.properties.push(propItem);
                }
            }
        }

        // combination all output
        const outcomes = nodeTypeDescriptor?.outcomes ?? [];
        const outcomeValueProp = nodeTypePropInputList.find((x) => x.considerValuesAsOutcomes);

        if (outcomeValueProp) {
            const newValue = result.properties.find((x) => x.name == outcomeValueProp.name)?.value;
            if (newValue) {
                if (isArray<string>(newValue)) {
                    outcomes.push(...newValue);
                } else if (
                    typeof newValue == 'string' &&
                    newValue.startsWith('[') &&
                    newValue.endsWith(']')
                ) {
                    outcomes.push(...JSON.parse(newValue));
                }
            }
        }

        // special case
        if (nodeTypeDescriptor?.type == 'Switch') {
            const newValue = result.properties.find((x) => x.name == 'Cases')?.value;
            if (newValue) {
                if (
                    typeof newValue == 'string' &&
                    newValue.startsWith('[') &&
                    newValue.endsWith(']')
                ) {
                    const o: string[] = JSON.parse(newValue).map((x: any) => {
                        return x.name;
                    });
                    outcomes.push(...o);
                }
            }
        }

        result.outcomes = outcomes;

        console.debug('update node data: ', result);
        flowAction.current?.updateNodeProperties(editNodeId, result);
    };

    const handleSaveGraphData = async (publish: boolean = false) => {
        if (submiting) return;
        setSubmiting(true);
        const gdata = await flowAction.current?.getGraphData();

        if (gdata?.nodes.length == 0) {
            message.error('No nodes in the graph');
            setSubmiting(false);
            return;
        }

        const { activities, connections } = conventToServerData(gdata!);

        let result = null;
        if (definitionId) {
            result = await updateWorkflowDefinition(definitionId, {
                definition: definition as API.WorkflowDefinitionCreateOrUpdate,
                activities,
                connections,
                isPublished: publish,
            });
        } else {
            result = await createWorkflowDefinition({
                definition: definition as API.WorkflowDefinitionCreateOrUpdate,
                activities,
                connections,
                isPublished: publish,
            });
        }

        if (result) {
            if (publish) {
                message.success(
                    intl.formatMessage(
                        { id: 'page.definition.published.success' },
                        { version: result.version },
                    ),
                );
            } else {
                message.success(
                    intl.formatMessage(
                        { id: 'page.definition.saved.success' },
                        { version: result.version },
                    ),
                );
            }
            // new
            if (!definitionId) {
                // message.success('Create successed.');
                history.replace(`/designer?id=${result.definition?.id}`);
            }
            // clear
            setFromDefinition(undefined);
            //
            setDefinitionId(result.definition!.id);
            setVersion(result.version!);
            //
            setDefinitionVersion(result);
            setDefinition(result.definition);
        }

        setSubmiting(false);
    };

    const showCreateModal = () => {
        setEditModalTitle(intl.formatMessage({ id: 'common.dict.create' }));
        setEditModalVisible(true);
    };

    const showVariableModel = () => {
        setEditModalTitle(intl.formatMessage({ id: 'common.dict.edit' }));
        setVariableData(definition?.variables);
        setVariableEditModalVisible(true);
    };

    const handleVersionComparison = async (
        sourceVersionNumber: number,
        targetVersionNumber?: number,
    ) => {
        const loading = message.loading(intl.formatMessage({ id: 'common.dict.loading' }));

        const sourceVersion = await getWorkflowDefinitionVersion(
            definitionId!,
            sourceVersionNumber,
        );
        let targetVersion: API.WorkflowDefinitionVersion;
        if (targetVersionNumber) {
            targetVersion = await getWorkflowDefinitionVersion(definitionId!, targetVersionNumber);
        } else {
            targetVersion = await getWorkflowDefinitionPreviousVersion(
                definitionId!,
                sourceVersionNumber,
            );
        }

        if (!targetVersion) {
            message.error('The comparison version not found.');
            return;
        }

        const sourceContent = YAML.stringify({
            version: targetVersion.version,
            activities: targetVersion.activities,
            connections: targetVersion.connections,
        });
        const targetContent = YAML.stringify({
            version: sourceVersionNumber,
            activities: sourceVersion.activities,
            connections: sourceVersion.connections,
        });

        if (sourceVersionNumber > targetVersion.version!) {
            setVersionDiffData({ source: sourceContent, target: targetContent });
            setVersionDiffModalTitle(
                intl.formatMessage(
                    {
                        id: 'page.definition.versions.comparison.label',
                    },
                    { v1: targetVersion.version, v2: sourceVersionNumber },
                ),
            );
        } else {
            setVersionDiffData({ source: targetContent, target: sourceContent });
            setVersionDiffModalTitle(
                intl.formatMessage(
                    {
                        id: 'page.definition.versions.comparison.label',
                    },
                    { v1: sourceVersionNumber, v2: targetVersion.version },
                ),
            );
        }

        setVersionDiffModalVisible(true);
        loading();
    };

    const showJsonEditor = async () => {
        const loading = message.loading(intl.formatMessage({ id: 'common.dict.loading' }), 1);
        const result = await flowAction.current?.getGraphData();
        if (result) {
            setDiagnosticsOptions({
                validate: true,
                enableSchemaRequest: true,
                format: true,
                hover: true,
                completion: true,
                schemas: [
                    {
                        uri: 'http://myserver/foo-schema.json',
                        fileMatch: ['*'],
                        // @ts-ignore
                        schema: definitionJsonSchema,
                    },
                ],
            });
            const result2 = conventToServerData(result);
            // const variables = definition?.variables ?? {};
            // const data2 = { variables, ...result2 };
            // remove null value key!
            const yamlString = YAML.stringify(
                JSON.parse(
                    JSON.stringify(result2, (key, value) => {
                        if (value !== null) return value;
                    }),
                ),
            );
            setJsonEditorValue(yamlString);
            setJsonEditorVisible(true);
            loading();
        } else {
            message.error('Get graph data failed');
        }
    };

    const handleUpdateFromJsonEditor = async () => {
        const loading = message.loading(intl.formatMessage({ id: 'common.dict.loading' }), 1);
        try {
            const data = YAML.parse(jsonEditorValue);
            const data2 = { connections: data.connections ?? [], activities: data.activities };

            // validation
            const validateResult = new Validator().validate(data, definitionJsonSchema);
            // console.debug(validateResult);
            if (!validateResult.valid) {
                message.error(validateResult.errors[0].toString(), 3.6);
            } else {
                setJsonEditorVisible(false);
                await loadServerData(data2 as unknown as API.WorkflowDefinitionVersion, false);

                // variables
                if (data.variables) {
                    // @ts-ignore
                    setDefinition({
                        ...definition,
                        variables: data.variables,
                    });
                }
            }
        } catch (error) {
            console.error(error);
            message.error('Update failed');
        }
        loading();
    };

    const updateMonacorEditorSciptProvider = () => {
        const updateEditorScriptExtraLibs = async () => {
            if (!definitionId) return;
            console.debug('update javascript libs');

            // update
            const libContent = await getJavascriptEditorDefinitonsContent(definitionId);
            if (libContent) {
                const libs: {
                    content: string;
                    filePath: string;
                }[] = [{ content: libContent, filePath: 'definiton.d.ts' }];
                monaco.languages.typescript.javascriptDefaults.setExtraLibs(libs);

                libs.forEach((x) => {
                    const oldModel = monaco.editor.getModel(monaco.Uri.parse(x.filePath));

                    if (oldModel) oldModel.dispose();

                    monaco.editor.createModel(
                        x.content,
                        'typescript',
                        monaco.Uri.parse(x.filePath),
                    );
                });
            }

            // update default
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ES5,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Classic,
                module: monaco.languages.typescript.ModuleKind.ES2015,
                allowNonTsExtensions: true,
                allowJs: true,
                checkJs: true,
            });
        };

        const registerCSharpLanguageProvider = () => {
            console.debug('register CSharp language provider ');

            const completionProvider = monaco.languages.registerCompletionItemProvider('csharp', {
                triggerCharacters: ['.'],
                provideCompletionItems: async (model, position) => {
                    const result = await getCSharpEditorLanguageProvider(
                        definitionId!,
                        'completion',
                        {
                            id: model.uri.path.substring(1),
                            text: model.getValue() ?? '',
                            position: model.getOffsetAt(position),
                        },
                    );

                    const word = model.getWordUntilPosition(position);
                    const range: monaco.IRange = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    };

                    if (result) {
                        const suggestions: monaco.languages.CompletionItem[] = (
                            result as API.WorkflowCSharpEditorCompletionItem[]
                        ).map((x) => {
                            return {
                                label: {
                                    label: x.suggestion!,
                                    description: x.description,
                                },
                                insertText: x.suggestion ?? '',
                                range: range,
                                kind:
                                    x.itemKind == WorkflowCSharpEditorCompletionItemKind.Function
                                        ? monaco.languages.CompletionItemKind.Method
                                        : x.itemKind == WorkflowCSharpEditorCompletionItemKind.Class
                                        ? monaco.languages.CompletionItemKind.Class
                                        : x.itemKind == WorkflowCSharpEditorCompletionItemKind.Field
                                        ? monaco.languages.CompletionItemKind.Field
                                        : x.itemKind ==
                                          WorkflowCSharpEditorCompletionItemKind.Variable
                                        ? monaco.languages.CompletionItemKind.Variable
                                        : x.itemKind ==
                                          WorkflowCSharpEditorCompletionItemKind.Property
                                        ? monaco.languages.CompletionItemKind.Property
                                        : x.itemKind == WorkflowCSharpEditorCompletionItemKind.Enum
                                        ? monaco.languages.CompletionItemKind.Enum
                                        : monaco.languages.CompletionItemKind.Text,
                            };
                        });
                        return { suggestions: suggestions, dispose: () => {} };
                    } else {
                        return { suggestions: [] };
                    }
                },
            });

            const hoverProvider = monaco.languages.registerHoverProvider('csharp', {
                provideHover: async (model, position) => {
                    const result = (await getCSharpEditorLanguageProvider(
                        definitionId!,
                        'hoverinfo',
                        {
                            id: model.uri.path.substring(1),
                            text: model.getValue() ?? '',
                            position: model.getOffsetAt(position),
                        },
                    )) as API.WorkflowDesignerCSharpLanguageHoverProviderResult;
                    if (result) {
                        const posStart = model.getPositionAt(result.offsetFrom!);
                        const posEnd = model.getPositionAt(result.offsetTo!);

                        return {
                            range: new monaco.Range(
                                posStart.lineNumber,
                                posStart.column,
                                posEnd.lineNumber,
                                posEnd.column,
                            ),
                            contents: [
                                {
                                    value: result.information!,
                                },
                            ],
                        };
                    } else {
                        return null;
                    }
                },
            });

            const signatureProvider = monaco.languages.registerSignatureHelpProvider('csharp', {
                signatureHelpTriggerCharacters: ['('],
                signatureHelpRetriggerCharacters: [','],
                provideSignatureHelp: async (model, position) => {
                    const result = (await getCSharpEditorLanguageProvider(
                        definitionId!,
                        'signature',
                        {
                            id: model.uri.path.substring(1),
                            text: model.getValue() ?? '',
                            position: model.getOffsetAt(position),
                        },
                    )) as API.WorkflowDesignerCSharpLanguageSignatureProviderResult;
                    if (result) {
                        return {
                            value: {
                                activeParameter: result.activeParameter,
                                activeSignature: result.activeSignature,
                                signatures: (result.signatures ?? []).map((item) => {
                                    return {
                                        label: item.label ?? '',
                                        documentation: item.documentation ?? '',
                                        parameters: item.parameters,
                                    };
                                }) as monaco.languages.SignatureInformation[],
                            },
                            dispose: () => {},
                        };
                    } else {
                        return null;
                    }
                },
            });

            const formamttingProvider = monaco.languages.registerDocumentFormattingEditProvider(
                'csharp',
                {
                    provideDocumentFormattingEdits: async (model, options, token) => {
                        const loading = message.loading('Formatting');
                        const result = (await getCSharpEditorLanguageProvider(
                            definitionId!,
                            'format',
                            {
                                id: model.uri.path.substring(1),
                                text: model.getValue() ?? '',
                            },
                        )) as API.WorkflowDesignerCSharpLanguageFormatterResult;

                        loading();

                        let formatted: monaco.languages.TextEdit;
                        if (result) {
                            formatted = {
                                text: result.code ?? '',
                                range: {
                                    startColumn: 1,
                                    startLineNumber: 1,
                                    endColumn: model.getFullModelRange().endColumn,
                                    endLineNumber: model.getFullModelRange().endLineNumber,
                                },
                            };
                        } else {
                            formatted = {
                                text: model.getValue() ?? '',
                                range: {
                                    startColumn: 1,
                                    startLineNumber: 1,
                                    endColumn: model.getFullModelRange().endColumn,
                                    endLineNumber: model.getFullModelRange().endLineNumber,
                                },
                            };
                        }

                        return [formatted] as monaco.languages.TextEdit[];
                    },
                },
            );

            //
            const codeAnalysis = async (model: monaco.editor.ITextModel) => {
                // check is dispose
                if (model.isDisposed()) return;

                const data = (await getCSharpEditorLanguageProvider(definitionId!, 'analysis', {
                    id: model.uri.path.substring(1),
                    text: model.getValue() ?? '',
                })) as API.WorkflowCSharpEditorCodeAnalysis[];

                // check again
                if (model.isDisposed()) return;

                const markers = (data ?? []).map((item: any) => {
                    const fromPosition = model.getPositionAt(item.offsetFrom);
                    const toPosition = model.getPositionAt(item.offsetTo);
                    return {
                        severity: item.severity,
                        startLineNumber: fromPosition.lineNumber,
                        startColumn: fromPosition.column,
                        endLineNumber: toPosition.lineNumber,
                        endColumn: toPosition.column,
                        message: item.message,
                        code: item.id,
                    } as unknown as monaco.editor.IMarkerData;
                });

                // update markers
                console.info('update markers: ', model.id, markers);
                monaco.editor.setModelMarkers(model, 'csharp', markers);
            };

            const codeAnalysisProvider = monaco.editor.onDidCreateModel((model) => {
                if (model.getLanguageId() != 'csharp') return;

                // when content changed
                model.onDidChangeContent(() => {
                    // clear markers
                    monaco.editor.setModelMarkers(model, 'csharp', []);
                    // delay
                    if (codeAnalysisTimer) window.clearTimeout(codeAnalysisTimer);
                    codeAnalysisTimer = window.setTimeout(function () {
                        monaco.editor.getModels().forEach((m) => {
                            if (m.getLanguageId() == 'csharp') {
                                codeAnalysis(m);
                            }
                        });
                    }, 1500);
                });

                // call when create
                codeAnalysis(model);
            });

            return {
                completionProvider,
                hoverProvider,
                signatureProvider,
                codeAnalysisProvider,
                formamttingProvider,
            };
        };

        updateEditorScriptExtraLibs();
        return registerCSharpLanguageProvider();
    };

    const handleNodeDbClick = (nodeConfig: Node.Properties, node: Node) => {
        handleShowNodeEditForm(nodeConfig, node);
    };

    const handleEdgeDbClick = (graph: Graph, edge: Edge<Edge.Properties>) => {
        const loading = message.loading(intl.formatMessage({ id: 'common.dict.loading' }));
        //
        const sourceNode = edge.getSourceNode();
        if (!sourceNode) {
            loading();
            return;
        }
        const allOutcomes = getNodeOutcomes(sourceNode);
        if (allOutcomes?.length == 0) {
            loading();
            return;
        }

        const outEdges = graph.getOutgoingEdges(sourceNode) ?? [];
        const outEdgeNames = outEdges.map((x) => x.getProp('name') as string);

        const availableOutcomes = allOutcomes.filter(
            (x) => outEdgeNames.indexOf(x) == -1,
        ) as string[];

        if (availableOutcomes.length == 0) {
            loading();
            message.error(formatMessage({ id: 'page.designer.noMoreOutcomes' }));
            return;
        }

        setEdgeOutcomFormData({
            edgeId: edge.id,
            outcomes: availableOutcomes,
        });

        loading();
        setEdgeOutcomeChangeModalVisible(true);
    };

    const handleUpdateEdgeOutcomeChanged = async (values: any) => {
        flowAction.current?.setEdgeName(
            edgeOutcomFormData?.edgeId as string,
            values.outcome as string,
        );
        return true;
    };

    const loadStorageProviders = async () => {
        const result = await getWorkflowStorageProviders();
        setStorageProviders(result?.items ?? []);
    };

    const loadData = async (did: string, version?: number) => {
        setLoading(true);
        let definitonVersion: API.WorkflowDefinitionVersion;
        if (version) definitonVersion = await getWorkflowDefinitionVersion(did, version);
        else definitonVersion = await getWorkflowDefinition(did);
        //
        setLoading(false);
        if (definitonVersion) {
            setDefinitionVersion(definitonVersion);
            //
            setDefinition(definitonVersion.definition);
            setVersion(definitonVersion.version!);
            //
            await loadServerData(definitonVersion);

            //
            if (fromDefinition) {
                // update
                setDefinition({
                    ...definitonVersion.definition,
                    name: definitonVersion.definition?.name + '_copy',
                    displayName: definitonVersion.definition?.displayName + '_copy',
                });
                showCreateModal();
            }
        } else {
            history.goBack();
        }
    };

    const renderActionMenus = () => {
        return [
            access['ElsaWorkflow.Definitions.CreateOrUpdateOrPublish'] ? (
                <>
                    <Button
                        key="publish"
                        type="primary"
                        disabled={!definition?.name}
                        loading={submiting}
                        icon={<GlobalOutlined />}
                        onClick={async () => {
                            await handleSaveGraphData(true);
                        }}
                    >
                        {intl.formatMessage({ id: 'page.definition.publish' })}
                    </Button>
                    <Button
                        key="save"
                        type="default"
                        disabled={!definition?.name}
                        loading={submiting}
                        icon={<SaveOutlined />}
                        onClick={async () => {
                            await handleSaveGraphData();
                        }}
                    >
                        {intl.formatMessage({ id: 'common.dict.save' })}
                    </Button>
                </>
            ) : (
                <></>
            ),

            <Dropdown.Button
                key="more"
                disabled={submiting || !definition?.name}
                // icon={<SettingOutlined />}
                onClick={() => {
                    setEditModalTitle(intl.formatMessage({ id: 'common.dict.edit' }));
                    setEditModalVisible(true);
                }}
                menu={{
                    items: [
                        {
                            key: 'variables',
                            label: intl.formatMessage({ id: 'page.definition.edit.variables' }),
                            disabled: !definitionId,
                            onClick: () => showVariableModel(),
                        },
                        {
                            type: 'divider',
                        },
                        {
                            key: 'versions',
                            label: intl.formatMessage({ id: 'page.definition.versions' }),
                            disabled: !definitionId,
                            onClick: () => {
                                setVersionListModalVisible(true);
                            },
                        },
                        {
                            type: 'divider',
                        },
                        {
                            key: 'jsoneditor',
                            label: intl.formatMessage({ id: 'page.definition.showJsonEditor' }),
                            onClick: showJsonEditor,
                        },
                        {
                            type: 'divider',
                        },
                        {
                            key: 'export',
                            label: intl.formatMessage({ id: 'common.dict.export' }),
                            disabled: !access['ElsaWorkflow.Definitions.Export'],
                            onClick: handleOnExport,
                        },
                        {
                            key: 'import',
                            label: intl.formatMessage({ id: 'common.dict.import' }),
                            disabled: !access['ElsaWorkflow.Definitions.Import'],
                            onClick: () => {
                                setImportModalVisible(true);
                            },
                        },
                        {
                            type: 'divider',
                        },
                        {
                            key: 'autoSave',
                            label: autoSaveEnabled
                                ? intl.formatMessage({
                                      id: 'page.definition.autoSaveDisabled',
                                  })
                                : intl.formatMessage({
                                      id: 'page.definition.autoSaveEnabled',
                                  }),
                            disabled: !access['ElsaWorkflow.Definitions.CreateOrUpdateOrPublish'],
                            onClick: () => {
                                if (autoSaveEnabled) {
                                    message.info(
                                        intl.formatMessage({
                                            id: 'page.definition.autoSaveDisabledTips',
                                        }),
                                    );
                                } else {
                                    message.info(
                                        intl.formatMessage({
                                            id: 'page.definition.autoSaveEnabledTips',
                                        }),
                                    );
                                }
                                setAutoSaveEnabled(!autoSaveEnabled);
                            },
                        },
                    ],
                }}
            >
                <SettingOutlined />
                {intl.formatMessage({ id: 'page.definition.settings' })}
            </Dropdown.Button>,
        ];
    };

    const flowRef = React.useMemo(
        () => (
            <Flow
                actionRef={flowAction}
                graphData={graphData}
                onNodeDoubleClick={handleNodeDbClick}
                onEdgeDoubleClick={handleEdgeDbClick}
            />
        ),
        [graphData],
    );

    useEffect(() => {
        let timer: number | undefined = undefined;
        if (autoSaveEnabled) {
            timer = window.setInterval(() => {
                console.debug('auto save on ' + new Date());
                handleSaveGraphData(false);
            }, 10 * 1000);
        } else {
            if (timer) window.clearInterval(timer);
        }
        return () => {
            if (timer) window.clearInterval(timer);
        };
    }, [autoSaveEnabled]);

    useEffect(() => {
        loadStorageProviders();
    }, [0]);

    useEffect(() => {
        if (fromDefinition && !definitionId) {
            setDefinitionId(undefined);
            loadData(fromDefinition.id, fromDefinition.version);
        }
    }, [fromDefinition]);

    useEffect(() => {
        if (definitionId) {
            const dispose = updateMonacorEditorSciptProvider();

            return () => {
                dispose.codeAnalysisProvider?.dispose();
                dispose.completionProvider?.dispose();
                dispose.hoverProvider?.dispose();
                dispose.signatureProvider?.dispose();
                dispose.formamttingProvider?.dispose();
            };
        }

        return () => {};
    }, [definitionId]);

    useEffect(() => {
        // @ts-ignore
        const _id = (location.query?.id ?? '') as string | undefined;
        // @ts-ignore
        const _fromId = (location.query?.fromId ?? '') as string | undefined;
        // @ts-ignore
        const _fromVersion = (location.query?.fromVersion ?? undefined) as number | undefined;
        //
        setDefinitionId(_id);
        if (_fromId && _fromVersion) setFromDefinition({ id: _fromId, version: _fromVersion });
        if (_id) {
            loadData(_id);
        }
        if (!_id && !_fromId) {
            showCreateModal();
        }
    }, [0]);

    return (
        <PageContainer>
            <Card
                onKeyDown={async (e) => {
                    const charCode = String.fromCharCode(e.which).toLowerCase();
                    if ((e.ctrlKey || e.metaKey) && charCode === 's') {
                        e.preventDefault();
                        if (definition?.name) {
                            await handleSaveGraphData();
                        }
                    }
                }}
                className="designer"
                title={
                    <>
                        <span style={{ fontSize: 18 }}>{definition?.name} </span>
                        {!fromDefinition && (
                            <>
                                <Tag>
                                    {intl.formatMessage({ id: 'page.definition.latest' })}:{' '}
                                    {definition?.latestVersion ?? 1}
                                </Tag>
                                {definition?.publishedVersion && (
                                    <Tag>
                                        {intl.formatMessage({ id: 'page.definition.published' })}:{' '}
                                        {definition?.publishedVersion}
                                    </Tag>
                                )}
                            </>
                        )}
                    </>
                }
                extra={
                    <Space>
                        {jsonEditorVisible ? (
                            <>
                                <Button
                                    key="save"
                                    type="primary"
                                    disabled={!definition?.name}
                                    loading={submiting}
                                    onClick={async () => {
                                        await handleUpdateFromJsonEditor();
                                    }}
                                >
                                    {intl.formatMessage({ id: 'common.dict.save' })}
                                </Button>
                                <Button
                                    key="cancel"
                                    type="default"
                                    disabled={!definition?.name}
                                    loading={submiting}
                                    onClick={() => {
                                        // toggle
                                        setJsonEditorVisible(false);
                                    }}
                                >
                                    {intl.formatMessage({ id: 'common.dict.cancel' })}
                                </Button>
                            </>
                        ) : (
                            <>{renderActionMenus()}</>
                        )}
                    </Space>
                }
            >
                <Spin spinning={loading}>
                    {!jsonEditorVisible ? (
                        <>{flowRef}</>
                    ) : (
                        <div key="jsonEditorWapper" style={{ height: 'calc(100vh - 230px)' }}>
                            <MonacoEditor
                                language="yaml"
                                minimap={true}
                                value={jsonEditorValue}
                                onChange={(value) => {
                                    setJsonEditorValue(value);
                                }}
                                options={{
                                    readOnly: false,
                                    minimap: { enabled: true, autohide: false },
                                }}
                                // onMount={(e, m) => {
                                //     m.languages.json.jsonDefaults.setDiagnosticsOptions({
                                //         validate: true,
                                //         schemas: [
                                //             {
                                //                 uri: 'http://myserver/definitionJsonSchema.json',
                                //                 fileMatch: [e.getModel()!.uri?.toString()],
                                //                 schema: definitionJsonSchema,
                                //             },
                                //         ],
                                //     });
                                // }}
                            />
                        </div>
                    )}
                </Spin>
            </Card>
            {/* settings */}
            <ModalForm
                form={editForm}
                layout="horizontal"
                preserve={false}
                labelCol={{ span: 5 }}
                width={600}
                labelWrap
                title={editModalTitle}
                visible={editModalVisible}
                initialValues={definition}
                onVisibleChange={setEditModalVisible}
                onFinish={async (formData) => {
                    setDefinition({
                        ...definition,
                        ...formData,
                    });
                    return true;
                }}
                onValuesChange={(value: any) => {
                    if (value.displayName) {
                        editForm.setFieldsValue({
                            name: value.displayName?.replaceAll(' ', '-')?.toLowerCase(),
                        });
                    }
                }}
            >
                <EditFormItems />
            </ModalForm>

            {/* variable */}
            <VariableForm
                data={variableData}
                visible={variableEditModalVisible}
                onVisibleChange={setVariableEditModalVisible}
                onSubmit={async (value: any) => {
                    console.debug('update variables', value);
                    // @ts-ignore
                    setDefinition({
                        ...definition,
                        variables: value,
                    });
                    // message.success(intl.formatMessage({ id: 'common.dict.save.success' }));
                    return true;
                }}
            />

            {/* node property */}
            <ModalForm
                form={editNodeFormRef}
                layout="horizontal"
                modalProps={{ maskClosable: false, destroyOnClose: false }}
                preserve={false}
                labelWrap={true}
                title={nodeTypePropFormTitle}
                labelCol={{ span: 5 }}
                grid={true}
                width={800}
                initialValues={editNodeFormData}
                visible={nodeTypePropFormVisible}
                scrollToFirstError
                onVisibleChange={setNodeTypePropFormVisible}
                autoFocusFirstInput
                onFinish={async (formData) => {
                    await handleSaveNodeEditForm({
                        ...editNodeFormData,
                        ...formData,
                    } as NodeEditFormData);
                    return true;
                }}
            >
                <NodePropForm
                    workflowDefinitionId={definitionId}
                    activityId={editNodeFormData?.id ?? ''}
                    inProperties={nodeTypePropInputList}
                    outProperties={nodeTypePropOutputList}
                    storageProviders={storageProviders}
                />
            </ModalForm>
            {/* version list */}
            <Modal
                title={intl.formatMessage({ id: 'page.definition.versions' })}
                destroyOnClose
                open={versionListModalVisible}
                onCancel={() => setVersionListModalVisible(false)}
                width={680}
                onOk={() => {
                    if (oldVersion) {
                        setVersionListModalVisible(false);
                        message.loading(intl.formatMessage({ id: 'common.dict.loading' }), 1);
                        loadData(definitionId!, oldVersion);
                    } else {
                        message.error(
                            intl.formatMessage({ id: 'page.definition.versions.no-select' }),
                        );
                    }
                }}
            >
                <ProTable<API.WorkflowDefinitionVersionListItem>
                    search={false}
                    toolBarRender={false}
                    rowKey="version"
                    columns={[
                        {
                            title: intl.formatMessage({ id: 'page.definition.field.version' }),
                            dataIndex: 'version',
                        },
                        {
                            title: intl.formatMessage({ id: 'page.definition.field.isLatest' }),
                            dataIndex: 'isLatest',
                            align: 'center',
                            valueEnum: { true: { text: 'Y' }, false: { text: '-' } },
                        },
                        {
                            title: intl.formatMessage({ id: 'page.definition.field.isPublished' }),
                            dataIndex: 'isPublished',
                            align: 'center',
                            valueEnum: { true: { text: 'Y' }, false: { text: '-' } },
                        },
                        {
                            title: intl.formatMessage({
                                id: 'page.definition.field.lastModificationTime',
                            }),
                            dataIndex: 'creationTime',
                            valueType: 'dateTime',
                            width: 160,
                            align: 'center',
                            renderText: (_, record) => {
                                return record.lastModificationTime ?? record.creationTime;
                            },
                        },
                        {
                            title: intl.formatMessage({ id: 'page.definition.field.comparison' }),
                            dataIndex: 'Comparison',
                            width: 120,
                            align: 'center',
                            render: (_, record) => {
                                return (
                                    <>
                                        <a
                                            onClick={() => {
                                                handleVersionComparison(record.version!, version);
                                            }}
                                        >
                                            {intl.formatMessage({
                                                id: 'page.definition.versions.comparison-latest',
                                            })}
                                        </a>
                                        <br />
                                        <a
                                            onClick={() => {
                                                handleVersionComparison(record.version!);
                                            }}
                                        >
                                            {intl.formatMessage({
                                                id: 'page.definition.versions.comparison-previous',
                                            })}
                                        </a>
                                    </>
                                );
                            },
                        },
                        {
                            title: intl.formatMessage({ id: 'common.dict.table-action' }),
                            valueType: 'option',
                            width: 80,
                            align: 'center',
                            hideInTable: !access['ElsaWorkflow.Definitions.Delete'],
                            render: (text, record, _, action) => {
                                return (
                                    <Popconfirm
                                        title={intl.formatMessage({
                                            id: 'common.dict.delete.confirm',
                                        })}
                                        onConfirm={async () => {
                                            if (record.isPublished || record.isLatest) {
                                                message.error(
                                                    'Cannot delete published or latest version',
                                                );
                                            } else {
                                                const result =
                                                    await deleteWorkflowDefinitionVersion(
                                                        definitionId!,
                                                        record.version!,
                                                    );

                                                if (result?.response?.ok) {
                                                    action?.reload();
                                                }
                                            }
                                        }}
                                    >
                                        <a>{intl.formatMessage({ id: 'common.dict.delete' })}</a>
                                    </Popconfirm>
                                );
                            },
                        },
                    ]}
                    rowSelection={{
                        type: 'radio',
                        alwaysShowAlert: false,
                        onChange: (keys) => {
                            if (keys.length > 0) {
                                const v = parseInt(keys[0].toString());
                                setOldVersion(v);
                            }
                        },
                    }}
                    tableAlertRender={false}
                    pagination={{ pageSize: 10 }}
                    request={async (params) => {
                        const { current, pageSize } = params;
                        delete params.current;
                        delete params.pageSize;
                        const skipCount = (current! - 1) * pageSize!;
                        const result = await getWorkflowDefinitionVersions(definitionId!, {
                            skipCount,
                            maxResultCount: pageSize,
                        });
                        if (result) {
                            setOldVersion(undefined);
                            return {
                                success: true,
                                data: result.items,
                                total: result.totalCount,
                            };
                        } else {
                            return {
                                success: false,
                            };
                        }
                    }}
                />
            </Modal>
            {/* version diff */}
            <Modal
                title={versionDiffModalTitle}
                open={versionDiffModalVisible}
                onCancel={() => setVersionDiffModalVisible(false)}
                footer={false}
                width="90%"
                destroyOnClose
            >
                <div style={{ height: 'calc(100vh - 150px)' }}>
                    <DiffEditor
                        language="yaml"
                        original={versionDiffData?.source}
                        modified={versionDiffData?.target}
                        options={{
                            automaticLayout: true,
                            autoIndent: 'keep',
                            autoClosingBrackets: 'languageDefined',
                            foldingStrategy: 'auto',
                            readOnly: true,
                            minimap: { enabled: true, autohide: false },
                        }}
                    />
                </div>
            </Modal>
            {/* import */}
            <ModalForm
                title={intl.formatMessage({ id: 'common.dict.import' })}
                visible={importModalVisible}
                onVisibleChange={setImportModalVisible}
                modalProps={{ maskClosable: false, destroyOnClose: true }}
                preserve={false}
                labelWrap={true}
                width={650}
                onFinish={async (values) => {
                    if (!values.files?.length) {
                        return;
                    }
                    if (
                        await handleOnImport(
                            values.files[0].originFileObj,
                            values.autoLayout ?? true,
                        )
                    ) {
                        setImportModalVisible(false);
                    }
                }}
                submitter={{
                    searchConfig: { submitText: intl.formatMessage({ id: 'common.dict.import' }) },
                }}
            >
                <ProFormSwitch
                    label={intl.formatMessage({ id: 'page.definition.import.autoLayout' })}
                    name="autoLayout"
                />
                {/* <ProFormUploadButton accept=".json" /> */}
                <ProFormUploadDragger
                    label={intl.formatMessage({ id: 'page.definition.import.files' })}
                    name="files"
                    accept=".json"
                    max={1}
                    fieldProps={{
                        multiple: false,
                        maxCount: 1,
                        beforeUpload: () => {
                            return false;
                        },
                    }}
                    rules={[{ required: true }]}
                    requiredMark={false}
                />
            </ModalForm>
            {/* edge label(outcome) */}
            <ModalForm
                title={intl.formatMessage({ id: 'page.designer.selectNewOutcome' })}
                visible={edgeOutcomeChangeModalVisible}
                onVisibleChange={setEdgeOutcomeChangeModalVisible}
                modalProps={{ destroyOnClose: true }}
                width="380px"
                onFinish={handleUpdateEdgeOutcomeChanged}
            >
                <ProFormSelect
                    label={intl.formatMessage({ id: 'page.designer.selectNewOutcome' })}
                    name="outcome"
                    options={(edgeOutcomFormData?.outcomes ?? []).map((x) => {
                        return { label: x, value: x };
                    })}
                    rules={[{ required: true }]}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default Index;

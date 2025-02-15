﻿using Passingwind.Abp.ElsaModule.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace Passingwind.Abp.ElsaModule.Permissions;

public class ElsaModulePermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(ElsaModulePermissions.GroupName, L("Permission:ElsaModule"));

        var instancePermission = myGroup.AddPermission(ElsaModulePermissions.Instances.Default, L("Permission:Instance"));
        instancePermission.AddChild(ElsaModulePermissions.Instances.Action, L("Permission:Instance.Acton"));
        instancePermission.AddChild(ElsaModulePermissions.Instances.Statistic, L("Permission:Instance.Statistic"));
        instancePermission.AddChild(ElsaModulePermissions.Instances.Data, L("Permission:Instance.Data"));
        instancePermission.AddChild(ElsaModulePermissions.Instances.Delete, L("Permission:Delete"));

        var definitionPermission = myGroup.AddPermission(ElsaModulePermissions.Definitions.Default, L("Permission:Definition"));
        definitionPermission.AddChild(ElsaModulePermissions.Definitions.CreateOrUpdateOrPublish, L("Permission:Definition.Publish"));
        definitionPermission.AddChild(ElsaModulePermissions.Definitions.Dispatch, L("Permission:Definition.Dispatch"));
        definitionPermission.AddChild(ElsaModulePermissions.Definitions.Export, L("Permission:Definition.Export"));
        definitionPermission.AddChild(ElsaModulePermissions.Definitions.Import, L("Permission:Definition.Import"));
        definitionPermission.AddChild(ElsaModulePermissions.Definitions.Delete, L("Permission:Delete"));
        definitionPermission.AddChild(ElsaModulePermissions.Definitions.ManagePermissions, L("Permission:Definition.ManagePermissions"));

        var globalVariablesPermission = myGroup.AddPermission(ElsaModulePermissions.GlobalVariables.Default, L("Permission:GlobalVariables"));
        globalVariablesPermission.AddChild(ElsaModulePermissions.GlobalVariables.Create, L("Permission:Create"));
        globalVariablesPermission.AddChild(ElsaModulePermissions.GlobalVariables.Update, L("Permission:Update"));
        globalVariablesPermission.AddChild(ElsaModulePermissions.GlobalVariables.Delete, L("Permission:Delete"));

        var workflowGroupPermission = myGroup.AddPermission(ElsaModulePermissions.WorkflowGroup.Default, L("Permission:WorkflowGroups"));
        workflowGroupPermission.AddChild(ElsaModulePermissions.WorkflowGroup.Create, L("Permission:Create"));
        workflowGroupPermission.AddChild(ElsaModulePermissions.WorkflowGroup.Update, L("Permission:Update"));
        workflowGroupPermission.AddChild(ElsaModulePermissions.WorkflowGroup.Delete, L("Permission:Delete"));
        workflowGroupPermission.AddChild(ElsaModulePermissions.WorkflowGroup.ManagePermissions, L("Permission:WorkflowGroups.ManagePermissions"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<ElsaModuleResource>(name);
    }
}

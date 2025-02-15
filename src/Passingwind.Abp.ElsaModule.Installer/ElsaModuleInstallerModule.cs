﻿using Volo.Abp.Modularity;
using Volo.Abp.VirtualFileSystem;

namespace Passingwind.Abp.ElsaModule;

[DependsOn(
    typeof(AbpVirtualFileSystemModule)
    )]
public class ElsaModuleInstallerModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpVirtualFileSystemOptions>(options =>
        {
            options.FileSets.AddEmbedded<ElsaModuleInstallerModule>();
        });
    }
}

﻿using System;
using Elsa.Options;
using Microsoft.Extensions.DependencyInjection;
using Passingwind.Abp.ElsaModule.Services;
using Passingwind.Abp.ElsaModule.Stores;

namespace Passingwind.Abp.ElsaModule;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAbpElsa(this IServiceCollection services, Action<ElsaOptionsBuilder> configure = null)
    {
        return services
            .AddElsa(ob =>
            {
                ob.UseStore()
                    .AddCustomTenantAccessor<AbpElsaTenantAccessor>()
                    ;

                ob
                 .AddActivitiesFrom(typeof(ElsaModuleDomainModule))
                 .AddConsoleActivities()
                 .AddJavaScriptActivities();

                services.ExecutePreConfiguredActions<ElsaModuleOptions>(new ElsaModuleOptions(ob));

                configure?.Invoke(ob);
            });
    }

    public static ElsaOptionsBuilder UseStore(this ElsaOptionsBuilder builder)
    {
        return builder
                   .UseTriggerStore(sp => sp.GetRequiredService<TriggerStore>())
                   .UseBookmarkStore(sp => sp.GetRequiredService<BookmarkStore>())
                   .UseWorkflowDefinitionStore(sp => sp.GetRequiredService<WorkflowDefinitionStore>())
                   .UseWorkflowExecutionLogStore(sp => sp.GetRequiredService<WorkflowExecutionLogStore>())
                   .UseWorkflowInstanceStore(sp => sp.GetRequiredService<WorkflowInstanceStore>())
                   ;
    }

}

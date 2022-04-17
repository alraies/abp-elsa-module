﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Passingwind.Abp.ElsaModule.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

#nullable disable

namespace Passingwind.Abp.ElsaModule.Migrations
{
    [DbContext(typeof(ElsaModuleHttpApiHostMigrationsDbContext))]
    partial class ElsaModuleHttpApiHostMigrationsDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("_Abp_DatabaseProvider", EfCoreDatabaseProvider.SqlServer)
                .HasAnnotation("ProductVersion", "6.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder, 1L, 1);

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.Activity", b =>
                {
                    b.Property<Guid>("DefinitionVersionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<long>("ActivityId")
                        .HasColumnType("bigint");

                    b.Property<string>("Arrtibutes")
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("CreationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("CreationTime");

                    b.Property<Guid?>("CreatorId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("CreatorId");

                    b.Property<string>("Description")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<string>("DisplayName")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<DateTime?>("LastModificationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("LastModificationTime");

                    b.Property<Guid?>("LastModifierId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("LastModifierId");

                    b.Property<bool>("LoadWorkflowContext")
                        .HasColumnType("bit");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(64)
                        .HasColumnType("nvarchar(64)");

                    b.Property<bool>("PersistWorkflow")
                        .HasColumnType("bit");

                    b.Property<string>("Properties")
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("SaveWorkflowContext")
                        .HasColumnType("bit");

                    b.Property<string>("Type")
                        .IsRequired()
                        .HasMaxLength(32)
                        .HasColumnType("nvarchar(32)");

                    b.HasKey("DefinitionVersionId", "ActivityId");

                    b.ToTable("ElsaActivities", (string)null);
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.ActivityConnection", b =>
                {
                    b.Property<Guid>("DefinitionVersionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<long>("SourceId")
                        .HasColumnType("bigint");

                    b.Property<long>("TargetId")
                        .HasColumnType("bigint");

                    b.Property<string>("Outcome")
                        .HasMaxLength(64)
                        .HasColumnType("nvarchar(64)");

                    b.Property<DateTime>("CreationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("CreationTime");

                    b.Property<Guid?>("CreatorId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("CreatorId");

                    b.HasKey("DefinitionVersionId", "SourceId", "TargetId", "Outcome");

                    b.ToTable("ElsaActivityConnections", (string)null);
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.Bookmark", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<long>("ActivityId")
                        .HasColumnType("bigint");

                    b.Property<string>("ActivityType")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<string>("CorrelationId")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<DateTime>("CreationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("CreationTime");

                    b.Property<Guid?>("CreatorId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("CreatorId");

                    b.Property<string>("Hash")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<DateTime?>("LastModificationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("LastModificationTime");

                    b.Property<Guid?>("LastModifierId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("LastModifierId");

                    b.Property<string>("Model")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("ModelType")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<Guid?>("TenantId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("TenantId");

                    b.Property<Guid>("WorkflowInstanceId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("Id");

                    b.ToTable("ElsaBookmarks", (string)null);
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.Trigger", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<long>("ActivityId")
                        .HasColumnType("bigint");

                    b.Property<string>("ActivityType")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<DateTime>("CreationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("CreationTime");

                    b.Property<Guid?>("CreatorId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("CreatorId");

                    b.Property<string>("Hash")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<DateTime?>("LastModificationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("LastModificationTime");

                    b.Property<Guid?>("LastModifierId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("LastModifierId");

                    b.Property<string>("Model")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("ModelType")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<Guid?>("TenantId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("TenantId");

                    b.Property<Guid>("WorkflowDefinitionId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("Id");

                    b.ToTable("ElsaTriggers", (string)null);
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.WorkflowDefinition", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Channel")
                        .HasMaxLength(64)
                        .HasColumnType("nvarchar(64)");

                    b.Property<string>("ContextOptions")
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("CreationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("CreationTime");

                    b.Property<Guid?>("CreatorId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("CreatorId");

                    b.Property<string>("CustomAttributes")
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("DeleteCompletedInstances")
                        .HasColumnType("bit");

                    b.Property<Guid?>("DeleterId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("DeleterId");

                    b.Property<DateTime?>("DeletionTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("DeletionTime");

                    b.Property<string>("Description")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<string>("DisplayName")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<bool>("IsDeleted")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(false)
                        .HasColumnName("IsDeleted");

                    b.Property<bool>("IsSingleton")
                        .HasColumnType("bit");

                    b.Property<DateTime?>("LastModificationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("LastModificationTime");

                    b.Property<Guid?>("LastModifierId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("LastModifierId");

                    b.Property<int>("LatestVersion")
                        .HasColumnType("int");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(64)
                        .HasColumnType("nvarchar(64)");

                    b.Property<int>("PersistenceBehavior")
                        .HasColumnType("int");

                    b.Property<int?>("PublishedVersion")
                        .HasColumnType("int");

                    b.Property<string>("Tag")
                        .HasMaxLength(64)
                        .HasColumnType("nvarchar(64)");

                    b.Property<Guid?>("TenantId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("TenantId");

                    b.Property<string>("Variables")
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("Id");

                    b.ToTable("ElsaWorkflowDefinitions", (string)null);
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.WorkflowDefinitionVersion", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateTime>("CreationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("CreationTime");

                    b.Property<Guid?>("CreatorId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("CreatorId");

                    b.Property<Guid>("DefinitionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("DeleterId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("DeleterId");

                    b.Property<DateTime?>("DeletionTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("DeletionTime");

                    b.Property<bool>("IsDeleted")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(false)
                        .HasColumnName("IsDeleted");

                    b.Property<bool>("IsLatest")
                        .HasColumnType("bit");

                    b.Property<bool>("IsPublished")
                        .HasColumnType("bit");

                    b.Property<DateTime?>("LastModificationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("LastModificationTime");

                    b.Property<Guid?>("LastModifierId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("LastModifierId");

                    b.Property<Guid?>("TenantId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("TenantId");

                    b.Property<int>("Version")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("DefinitionId", "Version");

                    b.ToTable("ElsaWorkflowDefinitionVersions", (string)null);
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.WorkflowExecutionLog", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("Id"), 1L, 1);

                    b.Property<long>("ActivityId")
                        .HasColumnType("bigint");

                    b.Property<string>("ActivityType")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<DateTime>("CreationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("CreationTime");

                    b.Property<Guid?>("CreatorId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("CreatorId");

                    b.Property<string>("Data")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("EventName")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<string>("Message")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Source")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<Guid?>("TenantId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("TenantId");

                    b.Property<DateTime>("Timestamp")
                        .HasColumnType("datetime2");

                    b.Property<Guid>("WorkflowInstanceId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("Id");

                    b.HasIndex("WorkflowInstanceId");

                    b.ToTable("ElsaWorkflowExecutionLogs", (string)null);
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.WorkflowInstance", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("ActivityData")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("BlockingActivities")
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime?>("CancelledTime")
                        .HasColumnType("datetime2");

                    b.Property<string>("ContextId")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<string>("ContextType")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<string>("CorrelationId")
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.Property<DateTime>("CreationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("CreationTime");

                    b.Property<Guid?>("CreatorId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("CreatorId");

                    b.Property<string>("CurrentActivity")
                        .HasColumnType("nvarchar(max)");

                    b.Property<Guid>("DefinitionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("DefinitionVersionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("DeleterId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("DeleterId");

                    b.Property<DateTime?>("DeletionTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("DeletionTime");

                    b.Property<string>("Fault")
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime?>("FaultedTime")
                        .HasColumnType("datetime2");

                    b.Property<DateTime?>("FinishedTime")
                        .HasColumnType("datetime2");

                    b.Property<string>("Input")
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("IsDeleted")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(false)
                        .HasColumnName("IsDeleted");

                    b.Property<long?>("LastExecutedActivityId")
                        .HasColumnType("bigint");

                    b.Property<DateTime?>("LastExecutedTime")
                        .HasColumnType("datetime2");

                    b.Property<DateTime?>("LastModificationTime")
                        .HasColumnType("datetime2")
                        .HasColumnName("LastModificationTime");

                    b.Property<Guid?>("LastModifierId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("LastModifierId");

                    b.Property<string>("Metadata")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(64)
                        .HasColumnType("nvarchar(64)");

                    b.Property<string>("Output")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("ScheduledActivities")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Scopes")
                        .HasColumnType("nvarchar(max)");

                    b.Property<Guid?>("TenantId")
                        .HasColumnType("uniqueidentifier")
                        .HasColumnName("TenantId");

                    b.Property<string>("Variables")
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("Version")
                        .HasColumnType("int");

                    b.Property<int>("WorkflowStatus")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.ToTable("ElsaWorkflowInstances", (string)null);
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.Activity", b =>
                {
                    b.HasOne("Passingwind.Abp.ElsaModule.Common.WorkflowDefinitionVersion", null)
                        .WithMany("Activities")
                        .HasForeignKey("DefinitionVersionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.ActivityConnection", b =>
                {
                    b.HasOne("Passingwind.Abp.ElsaModule.Common.WorkflowDefinitionVersion", null)
                        .WithMany("Connections")
                        .HasForeignKey("DefinitionVersionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.WorkflowDefinitionVersion", b =>
                {
                    b.HasOne("Passingwind.Abp.ElsaModule.Common.WorkflowDefinition", "Definition")
                        .WithMany()
                        .HasForeignKey("DefinitionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Definition");
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.WorkflowExecutionLog", b =>
                {
                    b.HasOne("Passingwind.Abp.ElsaModule.Common.WorkflowInstance", "WorkflowInstance")
                        .WithMany()
                        .HasForeignKey("WorkflowInstanceId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("WorkflowInstance");
                });

            modelBuilder.Entity("Passingwind.Abp.ElsaModule.Common.WorkflowDefinitionVersion", b =>
                {
                    b.Navigation("Activities");

                    b.Navigation("Connections");
                });
#pragma warning restore 612, 618
        }
    }
}

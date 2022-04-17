﻿using System.Threading.Tasks;
using Elsa.Events;
using MediatR;
using Passingwind.Abp.ElsaModule.Common;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Entities.Events;
using Volo.Abp.EventBus;

namespace Passingwind.Abp.ElsaModule.Stores
{
    public class EntityEventHandler :
        ILocalEventHandler<EntityCreatedEventData<WorkflowDefinitionVersion>>,
        ILocalEventHandler<EntityUpdatedEventData<WorkflowDefinitionVersion>>,
        ILocalEventHandler<EntityDeletedEventData<WorkflowDefinitionVersion>>,
        ILocalEventHandler<EntityDeletedEventData<WorkflowInstance>>,
        ITransientDependency
    {
        private readonly IMediator _mediator;
        private readonly IStoreMapper _storeMapper;

        public EntityEventHandler(IMediator mediator, IStoreMapper storeMapper)
        {
            _mediator = mediator;
            _storeMapper = storeMapper;
        }

        public async Task HandleEventAsync(EntityCreatedEventData<WorkflowDefinitionVersion> eventData)
        {
            var model = _storeMapper.MapToModel(eventData.Entity);

            await _mediator.Publish(new WorkflowDefinitionSaved(model));

            if (model.IsPublished)
                await _mediator.Publish(new WorkflowDefinitionPublished(model));
        }

        public async Task HandleEventAsync(EntityUpdatedEventData<WorkflowDefinitionVersion> eventData)
        {
            var model = _storeMapper.MapToModel(eventData.Entity);

            await _mediator.Publish(new WorkflowDefinitionSaved(model));

            if (model.IsPublished)
                await _mediator.Publish(new WorkflowDefinitionPublished(model));
        }

        public async Task HandleEventAsync(EntityDeletedEventData<WorkflowDefinitionVersion> eventData)
        {
            await _mediator.Publish(new WorkflowDefinitionDeleted(new Elsa.Models.WorkflowDefinition()
            {
                Id = eventData.Entity.Id.ToString(),
                DefinitionId = eventData.Entity.DefinitionId.ToString(),
                Version = eventData.Entity.Version
            }));
        }

        public async Task HandleEventAsync(EntityDeletedEventData<WorkflowInstance> eventData)
        {
            var model = _storeMapper.MapToModel(eventData.Entity);

            await _mediator.Publish(new WorkflowInstanceDeleted(model));
        }

    }
}

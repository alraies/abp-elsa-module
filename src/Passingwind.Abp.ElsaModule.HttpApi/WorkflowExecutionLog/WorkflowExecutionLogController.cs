using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.Application.Dtos;

namespace Passingwind.Abp.ElsaModule.Common;

[RemoteService]
[Route("api/elsa/workflow/execution-logs")]
public class WorkflowExecutionLogController : ElsaModuleController, IWorkflowExecutionLogAppService
{
    private readonly IWorkflowExecutionLogAppService _service;

    public WorkflowExecutionLogController(IWorkflowExecutionLogAppService service)
    {
        _service = service;
    }

    [HttpGet("{id}")]
    public virtual Task<WorkflowExecutionLogDto> GetAsync(Guid id)
    {
        return _service.GetAsync(id);
    }

    [HttpGet()]
    public virtual Task<PagedResultDto<WorkflowExecutionLogDto>> GetListAsync(WorkflowExecutionLogListRequestDto input)
    {
        return _service.GetListAsync(input);
    }

}

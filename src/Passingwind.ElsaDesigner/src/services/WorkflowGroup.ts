﻿/**
 * Generate from url: https://localhost:44345/swagger/v1/swagger.json
 * It is recommended not to modify the document
 * Total count: 7
 **/
// @ts-ignore
/* eslint-disable */
import type { API } from "./typings";
import { request } from 'umi';

/**
 * *TODO* POST /api/elsa/workflow/groups 
 **/
export async function createWorkflowGroup(
    payload: API.WorkflowGroupCreateOrUpdate,
    options?: { [key: string]: any }
) {
    return request<API.WorkflowGroup>(`/api/elsa/workflow/groups`, {
        method: 'POST',
        data: payload,
        ...(options || {}),
    });
}

/**
 * *TODO* DELETE /api/elsa/workflow/groups/{id} 
 **/
export async function deleteWorkflowGroup(
    id: string,
    options?: { [key: string]: any }
) {
    return request<any>(`/api/elsa/workflow/groups/${id}`, {
        method: 'DELETE',
        getResponse: true,
        ...(options || {}),
    });
}

/**
 * *TODO* GET /api/elsa/workflow/groups/{id} 
 **/
export async function getWorkflowGroup(
    id: string,
    options?: { [key: string]: any }
) {
    return request<API.WorkflowGroup>(`/api/elsa/workflow/groups/${id}`, {
        method: 'GET',
        ...(options || {}),
    });
}

/**
 * *TODO* GET /api/elsa/workflow/groups 
 **/
export async function getWorkflowGroupList(
    params: {
        skipCount?: number | undefined,
        maxResultCount?: number | undefined
    },
    options?: { [key: string]: any }
) {
    return request<API.WorkflowGroupBasicPagedResult>(`/api/elsa/workflow/groups`, {
        method: 'GET',
        params: params,
        ...(options || {}),
    });
}

/**
 * *TODO* PUT /api/elsa/workflow/groups/{id} 
 **/
export async function updateWorkflowGroup(
    id: string,
    payload: API.WorkflowGroupCreateOrUpdate,
    options?: { [key: string]: any }
) {
    return request<API.WorkflowGroup>(`/api/elsa/workflow/groups/${id}`, {
        method: 'PUT',
        data: payload,
        ...(options || {}),
    });
}

/**
 * *TODO* PUT /api/elsa/workflow/groups/{id}/users 
 **/
export async function workflowGroupSetUsers(
    id: string,
    payload: API.WorkflowGroupUpdateUsersRequest,
    options?: { [key: string]: any }
) {
    return request<any>(`/api/elsa/workflow/groups/${id}/users`, {
        method: 'PUT',
        data: payload,
        getResponse: true,
        ...(options || {}),
    });
}

/**
 * *TODO* PUT /api/elsa/workflow/groups/{id}/workflows 
 **/
export async function workflowGroupSetWorkflowflows(
    id: string,
    payload: API.WorkflowGroupSetWorkflowRequest,
    options?: { [key: string]: any }
) {
    return request<any>(`/api/elsa/workflow/groups/${id}/workflows`, {
        method: 'PUT',
        data: payload,
        getResponse: true,
        ...(options || {}),
    });
}

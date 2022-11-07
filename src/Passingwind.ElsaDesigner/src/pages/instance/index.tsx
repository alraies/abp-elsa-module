import { WorkflowInstanceStatus } from '@/services/enums';
import type { GlobalAPI } from '@/services/global';
import type { API } from '@/services/typings';
import { getTableQueryParams, saveTableQueryParams } from '@/services/utils';
import { getWorkflowDefinitionList } from '@/services/WorkflowDefinition';
import {
    deleteWorkflowInstance,
    getWorkflowInstanceList,
    workflowInstanceCancel,
    workflowInstanceRetry,
} from '@/services/WorkflowInstance';
import type { ProFormInstance } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumnType } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { message, Modal } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useIntl } from 'umi';
import { workflowStatusEnum } from './status';

const Index: React.FC = () => {
    const intl = useIntl();

    const searchFormRef = useRef<ProFormInstance>();
    const actionRef = useRef<ActionType>();
    const [tableQueryConfig, setTableQueryConfig] = useState<GlobalAPI.TableQueryConfig>();

    useEffect(() => {
        const tableQueryConfig = getTableQueryParams('workflow_instances') ?? {};
        setTableQueryConfig(tableQueryConfig);
        searchFormRef.current?.setFieldsValue(tableQueryConfig?.filter);
    }, []);

    const columns: ProColumnType<API.WorkflowInstance>[] = [
        {
            dataIndex: 'workflowDefinitionId',
            title: intl.formatMessage({ id: 'page.instance.field.definition' }),
            hideInTable: true,
            valueType: 'select',
            request: async (p) => {
                const list = await getWorkflowDefinitionList({
                    filter: p.keyWords ?? '',
                    maxResultCount: 100,
                });
                return (list.items ?? []).map((x) => {
                    return {
                        label: `${x.displayName}(${x.name})`,
                        value: x.id,
                    };
                });
            },
            fieldProps: { showSearch: true },
        },
        {
            dataIndex: 'name',
            title: intl.formatMessage({ id: 'page.instance.field.name' }),
            copyable: true,
            render: (_, record) => {
                return (
                    <Link
                        to={{
                            pathname: `/instances/${record.id}`,
                        }}
                    >
                        {_}
                    </Link>
                );
            },
            sorter: true,
            sortOrder: tableQueryConfig?.sort?.name ?? undefined,
        },
        {
            dataIndex: 'version',
            title: intl.formatMessage({ id: 'page.instance.field.version' }),
            valueType: 'digit',
            width: 100,
            sorter: true,
            sortOrder: tableQueryConfig?.sort?.version ?? undefined,
        },
        {
            dataIndex: 'workflowStatus',
            title: intl.formatMessage({ id: 'page.instance.field.workflowStatus' }),
            valueEnum: workflowStatusEnum,
            width: 150,
            sorter: true,
            sortOrder: tableQueryConfig?.sort?.workflowStatus ?? undefined,
        },
        {
            dataIndex: 'creationTime',
            title: intl.formatMessage({ id: 'common.dict.creationTime' }),
            valueType: 'dateTime',
            search: false,
            sorter: true,
            sortOrder: tableQueryConfig?.sort?.creationTime ?? undefined,
        },
        {
            dataIndex: 'finishedTime',
            title: intl.formatMessage({ id: 'page.instance.field.finishedTime' }),
            valueType: 'dateTime',
            search: false,
            sorter: true,
            sortOrder: tableQueryConfig?.sort?.finishedTime ?? undefined,
        },
        {
            dataIndex: 'lastExecutedTime',
            title: intl.formatMessage({ id: 'page.instance.field.lastExecutedTime' }),
            valueType: 'dateTime',
            search: false,
            sorter: true,
            sortOrder: tableQueryConfig?.sort?.lastExecutedTime ?? undefined,
        },
        {
            dataIndex: 'faultedTime',
            title: intl.formatMessage({ id: 'page.instance.field.faultedTime' }),
            valueType: 'dateTime',
            search: false,
            sorter: true,
            sortOrder: tableQueryConfig?.sort?.faultedTime ?? undefined,
        },
        {
            dataIndex: 'correlationId',
            title: intl.formatMessage({ id: 'page.instance.field.correlationId' }),
            width: 150,
            ellipsis: true,
            copyable: true,
        },
        {
            title: intl.formatMessage({ id: 'common.dict.table-action' }),
            valueType: 'option',
            width: 170,
            align: 'center',
            render: (text, record, _, action) => {
                const menus = [];

                if (
                    record.workflowStatus == WorkflowInstanceStatus.Idle ||
                    record.workflowStatus == WorkflowInstanceStatus.Running ||
                    record.workflowStatus == WorkflowInstanceStatus.Suspended
                ) {
                    menus.push(
                        <a
                            key="cancel"
                            onClick={() => {
                                Modal.confirm({
                                    title: intl.formatMessage({
                                        id: 'page.instance.cancel.confirm.title',
                                    }),
                                    content: intl.formatMessage({
                                        id: 'page.instance.cancel.confirm.content',
                                    }),
                                    onOk: async () => {
                                        const result = await workflowInstanceCancel(record.id!);
                                        if (result?.response?.ok) {
                                            message.success(
                                                intl.formatMessage({
                                                    id: 'page.instance.cancel.confirm.success',
                                                }),
                                            );
                                            action?.reload();
                                        }
                                    },
                                });
                            }}
                        >
                            {intl.formatMessage({ id: 'page.instance.cancel' })}
                        </a>,
                    );
                }

                if (record.workflowStatus == WorkflowInstanceStatus.Faulted) {
                    menus.push(
                        <a
                            key="retry"
                            onClick={() => {
                                Modal.confirm({
                                    title: intl.formatMessage({
                                        id: 'page.instance.retry.confirm.title',
                                    }),
                                    content: intl.formatMessage({
                                        id: 'page.instance.retry.confirm.content',
                                    }),
                                    onOk: async () => {
                                        const result = await workflowInstanceRetry(record.id!, {});
                                        if (result?.response?.ok) {
                                            message.success(
                                                intl.formatMessage({
                                                    id: 'page.instance.retry.confirm.success',
                                                }),
                                            );
                                            action?.reload();
                                        }
                                    },
                                });
                            }}
                        >
                            {intl.formatMessage({ id: 'page.instance.retry' })}
                        </a>,
                    );
                }

                menus.push(
                    <a
                        key="delete"
                        onClick={() => {
                            Modal.confirm({
                                title: intl.formatMessage({
                                    id: 'common.dict.delete.confirm',
                                }),
                                content: intl.formatMessage({
                                    id: 'page.instance.delete.confirm.content',
                                }),
                                onOk: async () => {
                                    const result = await deleteWorkflowInstance(record.id!);
                                    if (result?.response?.ok) {
                                        message.success(
                                            intl.formatMessage({
                                                id: 'common.dict.delete.success',
                                            }),
                                        );
                                        action?.reload();
                                    }
                                },
                            });
                        }}
                    >
                        {intl.formatMessage({ id: 'common.dict.delete' })}
                    </a>,
                );

                return menus;
            },
        },
    ];

    return (
        <PageContainer>
            <ProTable<API.WorkflowInstance>
                columns={columns}
                actionRef={actionRef}
                formRef={searchFormRef}
                search={{ labelWidth: 120 }}
                rowKey="id"
                onReset={() => {
                    setTableQueryConfig({
                        ...tableQueryConfig,
                        filter: undefined,
                        pagination: undefined,
                    });
                }}
                pagination={tableQueryConfig?.pagination}
                onChange={(pagination, filters, sorter) => {
                    // sorter
                    let newConfig = {
                        ...tableQueryConfig,
                    };
                    if (sorter) {
                        newConfig = {
                            ...newConfig,
                            sort: { [sorter.field]: sorter.order },
                        };
                    }
                    setTableQueryConfig(newConfig);
                    saveTableQueryParams('workflow_instances', newConfig);
                }}
                request={async (params, sort) => {
                    console.log(params, sort);
                    const { current, pageSize } = params;
                    delete params.current;
                    delete params.pageSize;
                    const skipCount = (current! - 1) * pageSize!;

                    // filter
                    const newConfig = {
                        ...tableQueryConfig,
                        filter: { ...params },
                        pagination: { current, pageSize },
                    } as GlobalAPI.TableQueryConfig;
                    setTableQueryConfig(newConfig);
                    saveTableQueryParams('workflow_instances', newConfig);

                    const sortResult = { ...(newConfig?.sort ?? {}), ...(sort ?? {}) };
                    const sorting = Object.keys(sortResult ?? {})
                        .map((x) => {
                            return `${x} ${sortResult[x] == 'ascend' ? '' : 'desc'}`;
                        })
                        ?.join(', ');

                    const result = await getWorkflowInstanceList({
                        ...params,
                        skipCount,
                        maxResultCount: pageSize,
                        sorting: sorting,
                    });
                    return {
                        success: !!result,
                        data: result?.items,
                        total: result?.totalCount,
                    };
                }}
            />
        </PageContainer>
    );
};

export default Index;

'use client';

import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { fetchRobotDetail, sendRobotCommand } from '../adapter/robotDetailAdapter';
import type { RobotCommandType } from '../types/robotDetail';

export const robotDetailQuery = (robotId: string) =>
  queryOptions({
    queryKey: ['robot', robotId, 'detail'],
    queryFn: () => fetchRobotDetail(robotId),
    refetchOnWindowFocus: true,
  });

export function useRobotDetailRepository(robotId: string) {
  const query = useQuery(robotDetailQuery(robotId));
  return {
    detail: query.data,
    isLoading: query.isPending,
    error: query.error,
    retry: () => {
      void query.refetch();
    },
  };
}

export function useRobotCommandRepository(robotId: string) {
  const mutation = useMutation({ mutationFn: (type: RobotCommandType) => sendRobotCommand(robotId, type) });
  return {
    send: mutation.mutate,
    isPending: mutation.isPending,
    sent: mutation.isSuccess ? mutation.variables : null,
    failed: mutation.isError,
  };
}

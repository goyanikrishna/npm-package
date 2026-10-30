// Response utility for node-backend-toolkit
import { Response } from 'express';
import { SuccessMessages } from '../constants/app-message.constant';

export interface IApiResponse<T = unknown> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

export const sendResponse = <T = unknown>(
  res: Response,
  data: T = [] as unknown as T,
  message: string = SuccessMessages.OPERATION_SUCCESS,
  status: number = 200,
): Response => {
  const success = status >= 200 && status < 300;
  const payload: IApiResponse<T> = {
    success,
    status,
    message,
    data,
  };
  return res.status(status).json(payload);
};

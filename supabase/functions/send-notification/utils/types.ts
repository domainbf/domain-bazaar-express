
export interface NotificationRequest {
  type: string;
  recipient: string;
  data: any; // Data structure varies based on notification type
}

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Ticket {
  id: number;
  jobId: string | null;
  customerName: string;
  customerEmail: string;
  subject: string;
  originalText: string;
  status: TicketStatus;
  category: TicketCategory | null;
  sentimentScore: number | null;
  urgency: TicketUrgency | null;
  aiDraftReply: string | null;
  aiAnalysis: string | null;
  finalReply: string | null;
  agentNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
  triagedAt: string | null;
  resolvedAt: string | null;
}

export type TicketStatus = 'PENDING' | 'PROCESSING' | 'TRIAGED' | 'APPROVED' | 'REJECTED' | 'FAILED';
export type TicketCategory = 'BILLING' | 'TECHNICAL' | 'FEATURE_REQUEST' | 'GENERAL' | 'UNKNOWN';
export type TicketUrgency = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TicketCreate {
  customerName: string;
  customerEmail: string;
  subject: string;
  originalText: string;
}

export interface TicketStats {
  total: number;
  pending: number;
  processing: number;
  triaged: number;
  approved: number;
  rejected: number;
  failed: number;
  byUrgency: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface HealthStatus {
  status: string;
  database: string;
  redis: string;
  timestamp: string;
}

export interface TriageStatus {
  ticketId: number;
  ticketStatus: string;
  jobId: string | null;
  jobState: string | null;
}

export const healthCheck = async (): Promise<HealthStatus> => {
  const response = await api.get<HealthStatus>('/health');
  return response.data;
};

export const getTickets = async (params?: {
  skip?: number;
  limit?: number;
  status?: string;
  urgency?: string;
  category?: string;
}): Promise<Ticket[]> => {
  const response = await api.get<Ticket[]>('/tickets', { params });
  return response.data;
};

export const getTicket = async (id: number): Promise<Ticket> => {
  const response = await api.get<Ticket>(`/tickets/${id}`);
  return response.data;
};

export const createTicket = async (data: TicketCreate): Promise<Ticket> => {
  const response = await api.post<Ticket>('/tickets', data);
  return response.data;
};

export const getTicketStats = async (): Promise<TicketStats> => {
  const response = await api.get<TicketStats>('/tickets/stats');
  return response.data;
};

export const getTriageStatus = async (ticketId: number): Promise<TriageStatus> => {
  const response = await api.get<TriageStatus>(`/tickets/${ticketId}/status`);
  return response.data;
};

export const approveTicket = async (
  ticketId: number, 
  data: { finalReply: string; agentNotes?: string }
): Promise<Ticket> => {
  const response = await api.post<Ticket>(`/tickets/${ticketId}/approve`, data);
  return response.data;
};

export const rejectTicket = async (ticketId: number): Promise<Ticket> => {
  const response = await api.post<Ticket>(`/tickets/${ticketId}/reject`);
  return response.data;
};

export const retryTriage = async (ticketId: number): Promise<Ticket> => {
  const response = await api.post<Ticket>(`/tickets/${ticketId}/retry`);
  return response.data;
};

export const updateTicket = async (
  ticketId: number,
  data: { finalReply?: string; agentNotes?: string; status?: string }
): Promise<Ticket> => {
  const response = await api.patch<Ticket>(`/tickets/${ticketId}`, data);
  return response.data;
};

export const normalizeStatus = (status: TicketStatus): string => {
  return status.toLowerCase();
};

export const normalizeUrgency = (urgency: TicketUrgency | null): string | null => {
  return urgency?.toLowerCase() || null;
};

export const normalizeCategory = (category: TicketCategory | null): string | null => {
  return category?.toLowerCase() || null;
};

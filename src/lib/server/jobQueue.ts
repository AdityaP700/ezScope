// Simple in-memory job queue
interface Job {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
    createdAt: number;
}

const jobs: Record<string, Job> = {};

export function createJob(): string {
    const id = Math.random().toString(36).slice(2);
    jobs[id] = {
        id,
        status: 'pending',
        createdAt: Date.now()
    };
    return id;
}

export function updateJob(id: string, status: Job['status'], result?: any, error?: string) {
    if (jobs[id]) {
        jobs[id].status = status;
        if (result) jobs[id].result = result;
        if (error) jobs[id].error = error;
    }
}

export function getJob(id: string): Job | undefined {
    return jobs[id];
}

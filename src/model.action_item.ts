export type ActionItem =
    | CompletedActionItem
    | OpenActionItem
    ;

export type CompletedActionItem = {
    id: string
    status: "COMPLETED"
    created_at: Date
    last_updated: Date
    closed_at: Date

    workspace_id: string
    channel_id: string
    description: string
    owner: string | null
};

export type OpenActionItem = {
    id: string
    status: "OPEN"
    created_at: Date
    last_updated: Date

    workspace_id: string
    channel_id: string
    description: string
    owner: string | null
};

export function isCompleted(actionItem: ActionItem): actionItem is CompletedActionItem {
    return actionItem.status === "COMPLETED";
}

export function isOpen(actionItem: ActionItem): actionItem is OpenActionItem {
    return actionItem.status === "OPEN";
}

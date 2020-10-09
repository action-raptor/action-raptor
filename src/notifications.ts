import {Reader} from "fp-ts/lib/Reader";
import {AppDependencies} from "./app";

export type NotificationSettings = {
    on_action_add: boolean
    on_action_complete: boolean
    on_action_cancel: boolean
}

export function fetchNotificationSettings(workspaceId: string, channelId: string): Reader<AppDependencies, Promise<NotificationSettings>> {
    return new Reader<AppDependencies, Promise<NotificationSettings>>(async () => {
            return {
                on_action_add: true,
                on_action_complete: true,
                on_action_cancel: false,
            };
        }
    );
}

import {ActionsBlock, DividerBlock, SectionBlock} from "@slack/types";

export const markdownSection = (text: string): SectionBlock => {
    return ({
        type: "section",
        text: {
            type: "mrkdwn",
            text: text
        }
    });
};

export const editableActionLine = (text: string, actionId: string): SectionBlock => {
    return {
        type: "section",
        text: {
            type: "mrkdwn",
            text: text
        },
        accessory: {
            "type": "button",
            "action_id": `complete:${actionId}`,
            "text": {
                "type": "plain_text",
                "text": "Complete",
            }
        }
    };
};

export const listFooter = (): ActionsBlock => {
    return {
        type: "actions",
        elements: [
            {
                type: "button",
                action_id: "close_menu",
                text: {
                    type: "plain_text",
                    text: "Close"
                },
                style: "danger"
            },
            {
                type: "button",
                action_id: "add_action_item",
                text: {
                    type: "plain_text",
                    text: "Add"
                }
            },
            {
                type: "button",
                action_id: "post_to_channel",
                text: {
                    type: "plain_text",
                    text: "Post"
                },
                style: "primary"
            },
        ]
    }
};

export const divider = (): DividerBlock => {
    return {
        type: "divider"
    }
};

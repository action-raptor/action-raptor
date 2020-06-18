import {ActionsBlock, Block, DividerBlock, SectionBlock, View} from "@slack/types";


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
    return ({
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
    });
};

export const listFooter = (): ActionsBlock => {
    return {
        type: "actions",
        elements: [
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
                }
            }
        ]
    }
};

export const addItemModal = (metadata: string): View => {
    return {
        type: "modal",
        title: {
            type: "plain_text",
            text: "New Action Item",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Add",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
        },
        blocks: [
            {
                type: "input",
                block_id: "item_description",
                element: {
                    type: "plain_text_input",
                    action_id: "title",
                    placeholder: {
                        type: "plain_text",
                        text: "What needs done?"
                    }
                },
                label: {
                    type: "plain_text",
                    text: "Description"
                }
            },
            {
                type: "input",
                block_id: "owner_select",
                label: {
                    type: "plain_text",
                    text: "Action Item Owner"
                },
                element: {
                    action_id: "selected_item_owner",
                    type: "users_select",
                    placeholder: {
                        type: "plain_text",
                        text: "Select an item"
                    }
                }
            }
        ],
        private_metadata: metadata
    }
};

export const divider = (): DividerBlock => {
    return {
        type: "divider"
    }
};

export const homeView = (blocks: (Block)[]) => {
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Here are your open action items:"
            }
        },
        ...blocks
    ]
};
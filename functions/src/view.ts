import {SectionBlock} from "@slack/types";

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

export const helpSection = (): SectionBlock => {
    return markdownSection(helpText);
};

const helpText = `usage: /action <command> <options>

Add an action item:
    /action add <item description and owner>
    
List outstanding action items:
    /action list
`;
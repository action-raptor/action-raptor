import {Option, View} from "@slack/types";

export const nonsenseModal = (): View => {
    return {
        type: "modal",
        title: {
            type: "plain_text",
            text: "Settings",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Save",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
        },
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "*Daily Reminders*"
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Time of Day, in UTC (sorry)"
                },
                accessory: {
                    type: "multi_static_select",
                    placeholder: {
                        type: "plain_text",
                        text: "Select an item",
                        emoji: true
                    },
                    options: [...Array(24).keys()].map(timeSelectOption)
                }
            },
            {
                type: "section",
                text: {
                    type: "plain_text",
                    text: "Days of the Week:"
                },
                accessory: {
                    type: "checkboxes",
                    action_id: "days_of_week",
                    options: [{
                        value: "monday",
                        text: {
                            type: "plain_text",
                            text: "Monday"
                        }
                    }, {
                        value: "tuesday",
                        text: {
                            type: "plain_text",
                            text: "Tuesday"
                        }
                    }, {
                        value: "wednesday",
                        text: {
                            type: "plain_text",
                            text: "Wednesday"
                        }
                    }, {
                        value: "thursday",
                        text: {
                            type: "plain_text",
                            text: "Thursday"
                        }
                    }, {
                        value: "friday",
                        text: {
                            type: "plain_text",
                            text: "Friday"
                        }
                    }, {
                        value: "saturday",
                        text: {
                            type: "plain_text",
                            text: "Saturday"
                        }
                    }, {
                        value: "sunday",
                        text: {
                            type: "plain_text",
                            text: "Sunday",
                        }
                    }]
                }
            }]
    };
};

const timeSelectOption = (num: number): Option => {
    return {
        text: {
            type: "plain_text",
            text: num.toString()
        },
        value: num.toString()
    }
};
import * as express from "express";

export const landingHandler = (request: express.Request, response: express.Response) => {
    response.send(landing);
};

export const privacyHandler = (request: express.Request, response: express.Response) => {
    response.send(privacyPolicy);
};

export const supportHandler = (request: express.Request, response: express.Response) => {
    response.send(supportal);
};

const landing = `
<h1>Action Raptor</h1>
<p>rawr</p>
<p>This app helps you to keep your team and yourself accountable for action items people have committed to. You can add and complete items. You can have your team be reminded of the items. Behind the scenes, we'll keep track of some analytics and show them to each user on the app's home page.
</p>
<p>Click the link below to install!!</p>
<a href="https://slack.com/oauth/v2/authorize?client_id=6124229605.904278581350&scope=chat:write,commands&user_scope="><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
<p>See our privacy policy <a href="https://action-raptor.herokuapp.com/privacy-policy">here</a></p>
`;

const supportal = `
for support please contact chance.a.cyphers@gmail.com
`;

const privacyPolicy = `<h1>Action Raptor Privacy Policy</h1>
<h2Privacy Policy</h2>
<p>Last updated: 7/21/2020</p>
<p>Action Raptor ("us", "we", or "our") operates the Action Raptor Slack app. This page informs you of our policies regarding the collection, use and disclosure of Personal Information we receive from users of the app.
We use your Personal Information only for providing and improving the app. By using the app, you agree to the collection and use of information in accordance with this policy.
</p>
<h2>Information Collection And Use</h2>
<p>While using our app, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to your Slack user id.
</p>
<h2>Security</h2>
<p>The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.
</p>
<h2>Changes To This Privacy Policy</h2>
<p>This Privacy Policy is effective as of 7/21/2020 and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
</p>
<p>We reserve the right to update or change our Privacy Policy at any time and you should check this Privacy Policy periodically. Your continued use of the Service after we post any modifications to the Privacy Policy on this page will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Privacy Policy.
</p>
<p>If we make any material changes to this Privacy Policy, we will notify you by placing a prominent notice on our website.
</p>
<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us: chance.a.cyphers@gmail.com
</p>
`;
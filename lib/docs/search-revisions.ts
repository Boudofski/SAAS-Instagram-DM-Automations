import type { DocsArticle } from './types';

export function reviseSearchDocs(article: DocsArticle): DocsArticle {
  if (article.slug !== 'migrating-from-manychat/disconnect-manychat-from-instagram') return article;
  return { ...article,
    title: 'How to Disconnect ManyChat from Instagram',
    description: 'Remove or temporarily disable the Instagram connection in ManyChat. Understand what happens to contacts, preserve your campaign and test before switching.',
    updated: '2026-10-23',
    html: `<p>To disconnect Instagram, use ManyChat on desktop and open Settings → Instagram. Decide whether you need to pause the channel or remove it. These actions have different effects.</p>
<h2 id="before-you-begin">Before you begin</h2><p>Keep the campaign details and any records you are entitled to retain. ManyChat warns that removing the Instagram account permanently deletes its associated Instagram contacts from ManyChat. Disabling the channel pauses automations without deleting contacts or automations.</p>
<h2 id="remove-the-instagram-connection-in-manychat">Remove the Instagram connection in ManyChat</h2><p>In the desktop interface, open Settings, select Instagram and find the account-removal section at the bottom. Select Remove. Read the two contact-deletion confirmations, enter Remove in the confirmation field and confirm only when ready. Channel removal is not available in the ManyChat mobile app.</p>
<h2 id="pause-instead-of-removing">Pause instead of removing</h2><p>For a temporary pause, use Disable Instagram Channel in the same settings area and confirm. You can enable it again later. See <a href="https://help.manychat.com/hc/en-us/articles/15582498909724-How-to-remove-an-Instagram-account-from-Manychat">ManyChat’s current removal and disabling instructions</a>, checked October 23, 2026.</p>
<h2 id="connect-and-test-ap3k">Connect and test AP3K</h2><p>Disconnecting a channel is different from cancelling a paid subscription. Check your billing separately. When switching, preserve the post, trigger, messages and destination. Avoid overlapping live rules for the same post.</p><p><a href="/docs/getting-started/connect-instagram-account">Connect Instagram to AP3K</a>, publish a reviewed rule and test from another account. Check the public reply, receiving inbox and final link independently. <a href="/blog/comment-to-dm-launch-test-plan">Use the campaign test checklist</a> before expanding.</p>`,
    headings: [
      {id:'before-you-begin',text:'Before you begin',level:2},
      {id:'remove-the-instagram-connection-in-manychat',text:'Remove the Instagram connection in ManyChat',level:2},
      {id:'pause-instead-of-removing',text:'Pause instead of removing',level:2},
      {id:'connect-and-test-ap3k',text:'Connect and test AP3K',level:2},
    ],
  };
}

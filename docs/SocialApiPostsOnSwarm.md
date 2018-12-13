# How are posts stored on Swarm?

We are trying to solve the following problems when storing posts on Swarm
- There is an ordering of the posts and if you a link to a newer post, you can access all the previous posts from it, so you can build a timeline of all posts.
- It's possible to update or delete a post from the timeline without having to update all the newer posts.

The basic idea is to store the posts (or the hashes of the posts) in Swarm Feeds, and each post contain a reference to the previous posts' Swarm Feed Manifest hash. Let's see an example.

When you create a new post, it is represented like this:

![Simple post](post1.png)

It stores the `text` ('Hello 1'), there are no `images` in it and we also so the time it was created in UTC milliseconds (`createdAt`). We store this object as JSON.

// TODO incomplete

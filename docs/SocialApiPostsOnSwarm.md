# How are post updates stored on Swarm?

When you create a new post, it is represented like this:

![Simple post](post1.png)

It stores the `text` ('Hello 1'), there are no `images` in it and we also so the time it was created in UTC milliseconds (`createdAt`). We store this object as JSON.


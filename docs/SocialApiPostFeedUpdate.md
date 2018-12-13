# How are post updates stored on Swarm?

When you create a new post, it is represented like this:

![Simple post](post1.png)

It stores the `text` ('Hello 1'), there are no `images` in it and we also so the time it was created in UTC milliseconds (`createdAt`). We store this object as JSON.

Then we put the latest 20 posts inside a PostFeed object and upload it to Swarm. In our example we have only one post yet.

![Swarm feed update](swarm-feed1.png)

In the example, after uploading the PostFeed object to Swarm, we get its hash back: 98f20e...

After we set the user's Swarm feed to store this hash. This has the advantage, that we can store this hash locally and compare if it changes when looking up Swarm feed updates, so we can spare downloading the PostFeed objects if it's not changing.

Then let's say we create a new post, with the `text` ('Hello 2') and one photo:

![2nd post with image](post2-with-image.png)

The photos are stored in an `ImageData` object, which have a field for storing the `localPath`, that is the path of the image on the local filesystem. We can also store the `width` and `height` so that later use the dimensions and ratio when displaying the image.

Then we upload the image to Swarm in a manifest, that currently only stores one image called `photo.png`. Later we can upload several versions of different sizes of the same picture, so that we can make downloading faster when displaying the post, by downloading the smaller version first. Then by request (e.g. the user clicks on the photo), we can download and show a bigger version of the same photo (this is not implemented yet).

After uploading the photo or photos to Swarm, we get the hash of the manifest. Then we store it locally in our `ImageData` object as `url`.

![2nd post with uploaded image](post2-with-uploaded-image.png)

Now we can add the second post to the PostFeed and upload the new version, so that it returns a new hash (117a26... ). Then we update the Swarm feed to store this hash.

![Swarm feed after update](swarm-feed2.png)


const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({ region: "us-west-2" });

exports.handler = async (event) => {
  const s3Record = event.Records[0];
  const bucketName = s3Record.s3.bucket.name;
  const objectKey = s3Record.s3.object.key;
  const timestamp = Date.now();

  const params = {
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify({
      timestamp,
      bucket: bucketName,
      key: objectKey,
      Records: event.Records,
    }),
  };

  try {
    const data = await sqs.send(new SendMessageCommand(params));
    console.log("Success, message sent. MessageID:", data.MessageId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Pushed to SQS successfully!",
        bucket: bucketName,
        key: objectKey,
      }),
    };
  } catch (err) {
    console.error("Error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to push to SQS",
        error: err.message,
      }),
    };
  }
};

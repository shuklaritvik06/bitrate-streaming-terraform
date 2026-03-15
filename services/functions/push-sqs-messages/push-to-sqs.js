const AWS = require("aws-sdk");
const ecs = new AWS.ECS({ region: "us-west-2" });

exports.handler = async (event) => {
  const batchItemFailures = [];

  const processRecord = async (record) => {
    const body = JSON.parse(record.body);

    const s3Record = body.Records?.[0];
    if (!s3Record) {
      throw new Error("No S3 record found in SQS message body");
    }

    const objectKey = decodeURIComponent(
      s3Record.s3.object.key.replace(/\+/g, " "),
    );
    const uuidMatch = objectKey.match(/([0-9a-fA-F-]{36})/);
    const uuid = uuidMatch ? uuidMatch[0] : null;

    if (!uuid) {
      throw new Error(`UUID not found in object key: ${objectKey}`);
    }

    console.log("Processing UUID:", uuid, "from key:", objectKey);

    const params = {
      startedBy: uuid,
      taskDefinition: "web-stream-task",
      cluster: "web-stream-cluster",
      overrides: {
        containerOverrides: [
          {
            name: "web-stream-container",
            environment: [
              { name: "UUID_TO_PROCESS", value: uuid },
              {
                name: "STREAM_URL",
                value:
                  "https://transformed-videos-streamer-ritvik.s3.us-west-2.amazonaws.com",
              },
            ],
          },
        ],
      },
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [
            process.env.PRIVATE_SUBNET_ONE_ID,
            process.env.PRIVATE_SUBNET_TWO_ID,
          ],
          securityGroups: [process.env.SECURITY_GROUP_ID],
          assignPublicIp: "DISABLED",
        },
      },
    };

    const data = await ecs.runTask(params).promise();

    if (data.failures?.length > 0) {
      throw new Error(`ECS runTask failed: ${JSON.stringify(data.failures)}`);
    }

    console.log("Task started successfully for UUID:", uuid);
  };

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error("Error processing record:", record.messageId, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};

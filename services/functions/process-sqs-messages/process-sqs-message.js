const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");

const ecs = new ECSClient({ region: "us-west-2" });

exports.handler = async (event) => {
  const batchItemFailures = [];

  console.log("PRIVATE_SUBNET_ONE_ID:", process.env.PRIVATE_SUBNET_ONE_ID);
  console.log("PRIVATE_SUBNET_TWO_ID:", process.env.PRIVATE_SUBNET_TWO_ID);
  console.log("SECURITY_GROUP_ID:", process.env.SECURITY_GROUP_ID);
  console.log("Processing SQS messages:", JSON.stringify(event));

  const processRecord = async (record) => {
    const body = JSON.parse(record.body);
    const objectKey = body.key;
    const uuidMatch = objectKey.match(/([0-9a-fA-F-]{36})/);
    const uuid = uuidMatch ? uuidMatch[0] : null;

    if (!uuid) {
      throw new Error("UUID not found in object key");
    }

    console.log("UUID:", uuid);

    const params = {
      startedBy: uuid,
      taskDefinition: process.env.ENCODER_TASK_DEFINITION_ARN,
      cluster: process.env.ECS_CLUSTER,
      overrides: {
        containerOverrides: [
          {
            name: "ritvik-web-streamer-prod-encoder-container",
            environment: [
              { name: "UUID_TO_PROCESS", value: uuid },
              { name: "STREAM_URL", value: process.env.STREAM_URL },
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

    const data = await ecs.send(new RunTaskCommand(params));

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

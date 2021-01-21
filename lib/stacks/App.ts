import path from "path";
import { HttpMethod } from "@aws-cdk/aws-apigatewayv2";
import { Construct, Stack, StackProps, CfnOutput, Duration } from "@aws-cdk/core";
import Api from "../constructs/Api";
import Databases from "../constructs/Databases";
import Endpoint from "../constructs/Endpoint";
import UserManagement from "../constructs/UserManagement";
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";

export default class AppStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const {
      userPool,
      userPoolClient
    } = new UserManagement(this, "UserManagement", {});

    const {
      table
    } = new Databases(this, "Databases", {});

    const { 
      api,
      authorizer,
    } = new Api(this, "Api", {
      userPool,
      userPoolClient,
    });
    
    const calculateThings = new Function(this, "calculatorFunction", {
      functionName: `${id}CalculatorFunction`,
      code: Code.fromAsset(path.join(__dirname, "..", "..", "src", "lambda", "calculator")),
      runtime: Runtime.PYTHON_3_8,
      handler: "index.handler",
      timeout: Duration.seconds(30),
      environment: { TABLE_NAME: table.tableName},
    });
    table.grantReadWriteData(calculateThings);

    const newThing = new Endpoint(this, "newThing", {
      httpApi: api,
      authorizer,
      dynamoTable: table,
      methods: [HttpMethod.POST],
      routePath: "/things",
      assetPath: ["things", "post"], // only what comes after -> /src/lambda/
      environment: {
        "CALCULATOR_LAMBDA": calculateThings.functionName
      }
    });
    calculateThings.grantInvoke(newThing.lambda);

    const getThings = new Endpoint(this, "getThings", {
      httpApi: api,
      authorizer,
      dynamoTable: table,
      methods: [HttpMethod.GET],
      routePath: "/things",
      assetPath: ["things", "get"], // only what comes after -> /src/lambda/
    });

    const getThing = new Endpoint(this, "getThing", {
      httpApi: api,
      authorizer,
      dynamoTable: table,
      methods: [HttpMethod.GET],
      routePath: "/things/{id}",
      assetPath: ["things", "get"], // only what comes after -> /src/lambda/
    });

  }
}

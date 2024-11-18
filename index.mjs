import Ajv from "ajv";
import addFormats from "ajv-formats";
import jwt from "jsonwebtoken";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import jwkToPem from "jwk-to-pem";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import schema from "./schema.json" assert { type: "json" };


const secretsManagerClient = new SecretsManagerClient({ region: "eu-north-1" });

//JSON Schema validation part
const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(schema);

const dynamodbClient = new DynamoDBClient({region:'eu-north-1'});




export const handler = async(event)=>{
try {
    const body = JSON.parse(event.body);
    const valid = validate(body)

    if(!valid){
        return {
            statusCode:400,
            body:JSON.stringify({error:"Invalid input",details:validate.errors})
        }
    }

    const params = {
        TableName:"companies",
        Item:{
            company_id: { N: body.company_id.toString() },
            company_name: { S: body.company_name },
            company_address: { S: body.company_address || "" },
            company_country: { S: body.company_country },
            company_city: { S: body.company_city },
            company_zip: { S: body.company_zip || "" },
            company_state: { S: body.company_state || "" },
            company_phone_number: { S: body.company_phone_number || "" },
            inserted_at: { S: body.inserted_at },
        }
    }

    await dynamodbClient.send(new PutItemCommand(params));

    return {
        statusCode: 201,
        body: JSON.stringify({ message: "Company record added successfully!" }),
      };


} catch (error) {
     return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error", details: error.message }),
    };
}
}

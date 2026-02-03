/**
 * AWS SSM Parameter Store Configuration
 * Fetches environment-specific configuration from AWS Parameter Store
 */

const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

/**
 * Fetch configuration from AWS Parameter Store
 * @param {string} environment - Environment (uat/staging/production)
 * @returns {Promise<Object>} Configuration object
 */
async function fetchAWSParameters(environment = 'uat') {
  // Normalize environment
  const env = environment === 'prod' ? 'production' : environment;

  if (!['uat', 'staging', 'production'].includes(env)) {
    throw new Error(`Invalid environment: ${environment}. Must be uat, staging, or production`);
  }

  const paramPrefix = `/${env}/sf360/test-automation`;

  // Parameter mappings
  const parameterMappings = {
    [`${paramPrefix}/server/ADDRESS`]: 'server',
    [`${paramPrefix}/aws-cognito/ADDRESS`]: 'cognitoAddress',
    [`${paramPrefix}/aws-cognito/ID`]: 'cognitoClientId',
    [`${paramPrefix}/sso/ADDRESS`]: 'ssoServer'
  };

  try {
    console.log(`Fetching configuration from AWS Parameter Store (${env})...`);

    const ssmClient = new SSMClient({ region: 'ap-southeast-2' });

    const command = new GetParametersCommand({
      Names: Object.keys(parameterMappings),
      WithDecryption: true
    });

    const response = await ssmClient.send(command);

    if (!response.Parameters || response.Parameters.length === 0) {
      throw new Error('No parameters returned from AWS Parameter Store');
    }

    // Map parameters to config object
    const config = {};
    response.Parameters.forEach(param => {
      const configKey = parameterMappings[param.Name];
      if (configKey) {
        config[configKey] = param.Value;
      }
    });

    // Check for missing parameters
    const requiredKeys = ['server', 'cognitoAddress', 'cognitoClientId', 'ssoServer'];
    const missingKeys = requiredKeys.filter(key => !config[key]);

    if (missingKeys.length > 0) {
      throw new Error(`Missing AWS parameters: ${missingKeys.join(', ')}`);
    }

    // Build formatted URLs
    const formattedConfig = {
      cognitoURL: `https://${config.cognitoAddress}`,
      cognitoClientId: config.cognitoClientId,
      ssoURL: `https://${config.ssoServer}`,
      serverURL: `https://${config.server}`,
      environment: env
    };

    console.log(`✓ AWS configuration loaded for ${env}`);

    return formattedConfig;

  } catch (error) {
    if (error.name === 'CredentialsProviderError' || error.name === 'UnrecognizedClientException') {
      throw new Error(
        'AWS credentials not configured. Please configure AWS CLI with: aws configure\n' +
        'You need access to BGL AWS account to fetch SF360 test configuration.'
      );
    } else if (error.name === 'AccessDeniedException') {
      throw new Error(
        'Access denied to AWS Parameter Store. Please ensure your AWS user has SSM:GetParameters permission.'
      );
    } else if (error.message && error.message.includes('Missing AWS parameters')) {
      throw error;
    } else {
      throw new Error(`Failed to fetch AWS configuration: ${error.message}`);
    }
  }
}

module.exports = {
  fetchAWSParameters
};

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const PICOVOICE_ACCESS_KEY = getRequiredEnvVar('PICOVOICE_ACCESS_KEY');

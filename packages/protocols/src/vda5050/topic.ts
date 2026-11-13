const subtopics = ['state', 'connection', 'factsheet', 'visualization'] as const;

export type Vda5050Subtopic = (typeof subtopics)[number];

export interface Vda5050TopicParts {
  manufacturer: string;
  serialNumber: string;
  subtopic: Vda5050Subtopic;
}

const interfaceName = 'vda5050';
const majorVersion = 'v3';

const isSubtopic = (value: string): value is Vda5050Subtopic =>
  (subtopics as readonly string[]).includes(value);

export function vda5050Topic(manufacturer: string, serialNumber: string, subtopic: Vda5050Subtopic): string {
  return [interfaceName, majorVersion, manufacturer, serialNumber, subtopic].join('/');
}

export function parseVda5050Topic(topic: string): Vda5050TopicParts | null {
  const parts = topic.split('/');
  if (parts.length !== 5) return null;
  const [name, version, manufacturer, serialNumber, subtopic] = parts;
  if (name !== interfaceName || version !== majorVersion) return null;
  if (!manufacturer || !serialNumber || !subtopic || !isSubtopic(subtopic)) return null;
  return { manufacturer, serialNumber, subtopic };
}

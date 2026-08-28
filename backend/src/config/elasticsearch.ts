import { Client } from '@elastic/elasticsearch';

const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

export const esClient = new Client({
  node: esUrl,
  maxRetries: 3,
  requestTimeout: 5000,
});

export const EMAILS_INDEX = 'emails';

export async function setupElasticsearchIndex() {
  try {
    const exists = await esClient.indices.exists({ index: EMAILS_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: EMAILS_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            sender: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            createdAt: { type: 'date' },
          },
        },
      });
      console.log(`✅ Created Elasticsearch index: ${EMAILS_INDEX}`);
    } else {
      console.log(`✅ Elasticsearch index '${EMAILS_INDEX}' verified`);
    }
  } catch (error: any) {
    console.warn(`⚠️ Elasticsearch initialization note: ${error.message}. Will use DB search fallback if needed.`);
  }
}

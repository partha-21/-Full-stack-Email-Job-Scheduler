import { esClient, EMAILS_INDEX } from '../config/elasticsearch';
import prisma from '../config/database';

export interface EmailDocument {
  id: string;
  userId: string;
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  createdAt: Date;
}

export class ElasticsearchService {
  static async indexEmail(emailDoc: EmailDocument): Promise<void> {
    try {
      await esClient.index({
        index: EMAILS_INDEX,
        id: emailDoc.id,
        document: {
          id: emailDoc.id,
          userId: emailDoc.userId,
          recipient: emailDoc.recipient,
          sender: emailDoc.sender,
          subject: emailDoc.subject,
          body: emailDoc.body,
          status: emailDoc.status,
          scheduledAt: emailDoc.scheduledAt.toISOString(),
          sentAt: emailDoc.sentAt ? emailDoc.sentAt.toISOString() : null,
          createdAt: emailDoc.createdAt.toISOString(),
        },
      });
      console.log(`🔎 Indexed email ${emailDoc.id} in Elasticsearch`);
    } catch (error: any) {
      console.warn(`⚠️ Elasticsearch indexing skipped/warned for ${emailDoc.id}: ${error.message}`);
    }
  }

  static async searchEmails(userId: string, query: string): Promise<any[]> {
    try {
      if (!query || query.trim() === '') {
        return [];
      }

      const response = await esClient.search({
        index: EMAILS_INDEX,
        query: {
          bool: {
            must: [
              { term: { userId: userId } },
              {
                multi_match: {
                  query: query,
                  fields: ['recipient^3', 'sender^2', 'subject^2', 'body'],
                  fuzziness: 'AUTO',
                },
              },
            ],
          },
        },
      });

      const hits = response.hits.hits;
      return hits.map((hit: any) => hit._source);
    } catch (error: any) {
      console.warn(`⚠️ Elasticsearch search failed (${error.message}). Falling back to database query.`);

      const dbResults = await prisma.email.findMany({
        where: {
          userId,
          OR: [
            { recipient: { contains: query } },
            { sender: { contains: query } },
            { subject: { contains: query } },
            { body: { contains: query } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      return dbResults;
    }
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { fileRecord } from '@server/database/schema';
import { eq, and, count, desc, like } from 'drizzle-orm';
import type { CreateFileRecordRequest } from '@shared/file-record';

@Injectable()
export class FileRecordService {
  private readonly logger = new Logger(FileRecordService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(params: {
    folderPath?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { folderPath, page = 1, pageSize = 20 } = params;

    const conditions = [];
    if (folderPath) {
      conditions.push(like(fileRecord.folderPath, `%${folderPath}%`));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(fileRecord)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: fileRecord.id,
        fileName: fileRecord.fileName,
        filePath: fileRecord.filePath,
        downloadUrl: fileRecord.downloadUrl,
        fileSize: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        folderPath: fileRecord.folderPath,
        uploadStatus: fileRecord.uploadStatus,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt,
      })
      .from(fileRecord)
      .where(whereClause)
      .orderBy(desc(fileRecord.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((item) => ({
        ...item,
        fileSize: Number(item.fileSize),
      })),
      total,
    };
  }

  async batchCreate(files: CreateFileRecordRequest[]) {
    if (!files || files.length === 0) {
      return { success: true, createdCount: 0 };
    }

    const values = files.map((f) => ({
      fileName: f.fileName,
      filePath: f.filePath,
      downloadUrl: f.downloadUrl,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
      folderPath: f.folderPath,
      uploadStatus: 'success',
    }));

    const result = await this.db
      .insert(fileRecord)
      .values(values)
      .returning({ id: fileRecord.id });

    this.logger.log(`Batch created ${result.length} file records`);

    return { success: true, createdCount: result.length };
  }

  async remove(id: string) {
    const target = await this.db
      .select({ filePath: fileRecord.filePath })
      .from(fileRecord)
      .where(eq(fileRecord.id, id));

    if (target.length === 0) {
      throw new NotFoundException(`文件记录 ${id} 不存在`);
    }

    await this.db
      .delete(fileRecord)
      .where(eq(fileRecord.id, id))
      .returning({ id: fileRecord.id });

    return { success: true, filePath: target[0].filePath };
  }
}

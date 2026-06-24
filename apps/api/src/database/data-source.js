import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();
export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: true,
    entities: [process.env.NODE_ENV === 'production' ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
    migrations: [process.env.NODE_ENV === 'production' ? 'dist/apps/api/src/database/migrations/*.js' : 'src/database/migrations/*.ts'],
});
//# sourceMappingURL=data-source.js.map
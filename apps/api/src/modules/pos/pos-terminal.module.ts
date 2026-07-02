import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosTerminalService } from './pos-terminal.service';
import { PosTerminalController } from './pos-terminal.controller';
import { PosTerminal } from './entities/pos-terminal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PosTerminal])],
  providers: [PosTerminalService],
  controllers: [PosTerminalController],
  exports: [PosTerminalService],
})
export class PosTerminalModule {}

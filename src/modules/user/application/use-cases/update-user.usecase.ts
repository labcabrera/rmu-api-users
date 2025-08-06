import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { KafkaProducerService } from '../../infrastructure/messaging/kafka-producer.service';
import { UpdateUserCommand } from '../commands/update-user.command';
import { UpdateUserPort } from '../ports/in/update-user.port';
import * as userRepositoryPort from '../ports/out/user-repository.port';

@Injectable()
export class UpdateUserUseCase implements UpdateUserPort {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepo: userRepositoryPort.UserRepositoryPort,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const exists = await this.userRepo.findById(command.id);
    if (!exists) throw new Error('User not found');
    const updateData: Partial<User> = {};
    if (command.username) {
      updateData['username'] = command.username;
    }
    const updated = await this.userRepo.update(command.id, updateData);
    await this.kafkaProducer.emit(
      'internal.rmu-users.user.updated.v1',
      updated,
    );
    return updated;
  }
}

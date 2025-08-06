import { Injectable, Inject } from '@nestjs/common';
import * as userRepositoryPort from '../ports/out/user-repository.port';
import { KafkaProducerService } from '../../infrastructure/messaging/kafka-producer.service';
import { DeleteUserPort } from '../ports/in/delete-user.port';
import { DeleteUserCommand } from '../commands/delete-user.command';

@Injectable()
export class DeleteUserUseCase implements DeleteUserPort {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepo: userRepositoryPort.UserRepositoryPort,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userRepo.findById(command.id);
    if (!user) throw new Error('User not found');
    await this.userRepo.deleteById(command.id);
    await this.kafkaProducer.emit('internal.rmu-users.user.deleted.v1', user);
  }
}

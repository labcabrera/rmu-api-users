import { Injectable, Inject } from '@nestjs/common';
import * as userRepositoryPort from '../ports/out/user-repository.port';
import { CreateUserPort } from '../ports/in/create-user.port';
import { User } from '../../domain/entities/user.entity';
import { KafkaProducerService } from '../../infrastructure/messaging/kafka-producer.service';
import { CreateUserCommand } from '../commands/create-user.command';

@Injectable()
export class CreateUserUseCase implements CreateUserPort {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepo: userRepositoryPort.UserRepositoryPort,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const inserted = await this.userRepo.save(command);
    await this.kafkaProducer.emit(
      'internal.rmu-users.user.created.v1',
      command,
    );
    return inserted;
  }
}

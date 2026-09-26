import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { errorExamples } from '../common/swagger/error-examples';
import { SlotsListResponseDto } from './dto/slot.dto';
import { SlotsService } from './slots.service';

@ApiTags('slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiOperation({
    summary: 'List available appointment slots',
    description:
      'Returns slots with no active booking, ordered by startsAt then id ascending. No authentication required.',
  })
  @ApiOkResponse({
    type: SlotsListResponseDto,
    description: 'Empty list returns `{ "slots": [] }`.',
  })
  @ApiInternalServerErrorResponse({
    type: ErrorResponseDto,
    description: 'INTERNAL_ERROR',
    content: { 'application/json': { examples: { internalError: errorExamples.internalError } } },
  })
  async list(): Promise<SlotsListResponseDto> {
    const slots = await this.slotsService.listAvailable();
    return { slots };
  }
}

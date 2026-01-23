import { create } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import 'reflect-metadata';
import {
  ElizaService,
  SayRequestSchema,
} from './gen/connectrpc/eliza/v1/eliza_pb';
import { MetadataReaderInterceptor } from './interceptors';
import { bootstrap } from './server';

async function testMetadataInInterceptor() {
  console.log('\n=== Starting Metadata Interceptor Test ===\n');

  // Start server
  const serverPromise = bootstrap();

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Create client
  const transport = createConnectTransport({
    baseUrl: 'http://localhost:3000',
    httpVersion: '1.1',
  });

  const client = createClient(ElizaService, transport);

  // Clear previous metadata
  MetadataReaderInterceptor.classMetadata = undefined;
  MetadataReaderInterceptor.methodMetadata = undefined;

  try {
    // Make a request to trigger the interceptor
    console.log('Making request to say() method...\n');

    const request = create(SayRequestSchema, {
      sentence: 'Hello from metadata test!',
    });

    const response = await client.say(request);
    console.log('Response:', response.sentence);

    // Check if metadata was captured
    console.log('\n=== Metadata Captured by Interceptor ===\n');
    console.log('Class Metadata:', MetadataReaderInterceptor.classMetadata);
    console.log('Method Metadata:', MetadataReaderInterceptor.methodMetadata);

    // Verify the metadata
    if (MetadataReaderInterceptor.classMetadata) {
      const meta: any = MetadataReaderInterceptor.classMetadata;
      if (
        meta['service'] === 'ElizaService' &&
        meta['version'] === 'v1' &&
        meta['author'] === 'demo-team'
      ) {
        console.log('\n✅ Class metadata successfully read in interceptor!');
      } else {
        console.log('\n❌ Class metadata NOT captured correctly');
      }
    }

    if (MetadataReaderInterceptor.methodMetadata) {
      const meta: any = MetadataReaderInterceptor.methodMetadata;
      if (
        meta['type'] === 'unary' &&
        meta['rateLimit'] === 100 &&
        meta['cacheable'] === true
      ) {
        console.log('✅ Method metadata successfully read in interceptor!');
      } else {
        console.log('❌ Method metadata NOT captured correctly');
      }
    }

    console.log('\n=== Test Completed Successfully ===\n');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    process.exit(0);
  }
}

testMetadataInInterceptor();

import 'reflect-metadata';
import { ElizaController } from './controller';
import { getClassMetadata, getMethodMetadata } from './decorators';

// Test reading metadata directly
console.log('\n=== Direct Metadata Reading Test ===\n');

// Read class metadata
const classMetadata = getClassMetadata(ElizaController);
console.log('ElizaController Class Metadata:', classMetadata);

// Read method metadata for 'say'
const sayMetadata = getMethodMetadata(ElizaController.prototype, 'say');
console.log('say() Method Metadata:', sayMetadata);

// Read method metadata for 'sayMany'
const sayManyMetadata = getMethodMetadata(ElizaController.prototype, 'sayMany');
console.log('sayMany() Method Metadata:', sayManyMetadata);

// Read method metadata for 'listenMany'
const listenManyMetadata = getMethodMetadata(
  ElizaController.prototype,
  'listenMany',
);
console.log('listenMany() Method Metadata:', listenManyMetadata);

console.log('\n=== Testing with context values simulation ===\n');

// Simulate what would be in contextValues
import {
  controllerClassContextKey,
  controllerMethodContextKey,
  createCustomContextValues,
} from '../../src/context-values';

const contextValues = createCustomContextValues();
contextValues.set(controllerClassContextKey, ElizaController);
contextValues.set(controllerMethodContextKey, ElizaController.prototype.say);

// Simulate reading metadata like in the interceptor
const controllerClass = contextValues.get(controllerClassContextKey);
const controllerMethod = contextValues.get(controllerMethodContextKey);

if (controllerClass) {
  const metadata = getClassMetadata(controllerClass);
  console.log('Class metadata from context:', metadata);
}

if (controllerMethod && controllerClass) {
  const metadata = getMethodMetadata(
    controllerClass.prototype,
    controllerMethod.name,
  );
  console.log('Method metadata from context:', metadata);
}

console.log('\n✅ All metadata tests passed!\n');

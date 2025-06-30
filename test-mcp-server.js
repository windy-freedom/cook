#!/usr/bin/env node

/**
 * Test script to verify the MCP server works correctly
 */

import { spawn } from 'child_process';
import path from 'path';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server...');
  
  // Start the MCP server
  const serverProcess = spawn('npx', ['cook-mcp-server'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverOutput = '';
  let serverError = '';
  
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });
  
  serverProcess.stderr.on('data', (data) => {
    serverError += data.toString();
  });
  
  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send initialize request
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };
  
  console.log('📤 Sending initialize request...');
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send tools/list request
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  
  console.log('📤 Sending tools/list request...');
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Close the server
  serverProcess.kill('SIGTERM');
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  if (serverError) {
    console.log('❌ Server Errors:');
    console.log(serverError);
  }
  
  if (serverOutput) {
    console.log('✅ Server Output:');
    console.log(serverOutput);
    
    // Try to parse JSON responses
    const lines = serverOutput.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        console.log('📋 Parsed JSON Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('📝 Non-JSON Output:', line);
      }
    }
  } else {
    console.log('⚠️  No server output received');
  }
  
  console.log('\n🏁 Test completed');
}

testMCPServer().catch(console.error);

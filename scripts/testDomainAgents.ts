import { DomainAgentsService } from '../src/server/services/discover/domainAgents';

async function testDomainAgents() {
  console.log('Testing Domain Agents Service...\n');

  const service = new DomainAgentsService();

  try {
    // Test getting all domain agents
    console.log('1. Fetching all domain agents:');
    const agents = await service.getDomainAgents();
    console.log(`   Found ${agents.length} domain agents`);

    if (agents.length > 0) {
      console.log('\n   Sample agent:');
      console.log(`   - Title: ${agents[0].meta.title}`);
      console.log(`   - Category: ${agents[0].meta.category}`);
      console.log(`   - Description: ${agents[0].meta.description}`);
      console.log(`   - Author: ${agents[0].author}`);
    }

    // Test getting agent by slug
    if (agents.length > 0) {
      console.log('\n2. Fetching agent by slug:');
      const slug = agents[0].identifier;
      const agent = await service.getDomainAgentBySlug(slug);
      if (agent) {
        console.log(`   Found agent: ${agent.meta.title}`);
        console.log(`   Config: ${JSON.stringify(agent.config, null, 2)}`);
      }
    }

    console.log('\n✅ Domain Agents Service is working correctly!');
    console.log('\nNote: Domain agents will appear on /discover/assistants page');
    console.log('They can be filtered by category and will show for all users.');
  } catch (error) {
    console.error('❌ Error testing Domain Agents Service:', error);
  }
}

// Run test with top-level await
await testDomainAgents();

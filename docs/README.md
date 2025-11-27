# Config Service Documentation

Welcome to the Generic Configuration Service documentation!

## Documentation Files

### 📘 [Architecture](./architecture.md)
Complete system architecture documentation including:
- High-level architecture diagrams
- Component architecture
- ER diagrams (Mermaid)
- Data flow diagrams
- API design patterns
- Deployment architecture
- Technology stack

**Use this to:** Understand how the system works internally

### 📗 [API Reference](./api-reference.md)
Comprehensive API documentation including:
- All endpoint specifications
- Request/response examples
- Error responses
- SDK examples (Python, JavaScript)
- Rate limiting guidance

**Use this to:** Integrate your services with the Config Service

### 🏗️ [Reference Data Pattern](./reference-data-pattern.md) ⭐ **Critical**
Architectural guide demonstrating the reference data pattern:
- How services use Config Service as authoritative source
- Foreign key validation patterns
- Real-world database schema examples
- Integration patterns with fictional services
- Performance optimization with caching
- Migration strategies

**Use this to:** Understand how to architect services that consume reference data

### 📕 [Usage Guide](./usage-guide.md)
Practical guide with step-by-step instructions:
- Quick start tutorial
- Common use cases with examples
- Best practices
- Migration guide (from hardcoded configs)
- Troubleshooting
- FAQ

**Use this to:** Learn how to use the Config Service effectively

### 📙 [Architecture Review](./architecture_review.md)
Independent architecture review with recommendations (if available)

---

## Quick Links

**Getting Started:**
1. Read [Usage Guide - Quick Start](./usage-guide.md#quick-start)
2. Browse [API Reference](./api-reference.md)
3. Review [Architecture](./architecture.md) for deep dive

**For Developers Integrating:**
- [API Reference - Reference Data API](./api-reference.md#reference-data-api-)
- [Usage Guide - External Service Integration](./usage-guide.md#external-service-integration)
- [API Reference - SDK Examples](./api-reference.md#sdk-examples)

**For System Administrators:**
- [Architecture - Deployment Architecture](./architecture.md#deployment-architecture)
- [Architecture - Security & Best Practices](./architecture.md#security--best-practices)
- [Architecture - Technology Stack](./architecture.md#technology-stack)

---

## Key Concepts

### Schema-Driven
Define configuration structure using JSON Schema. No code changes needed to add new config types.

### Reference Data
Configurations used by other services as foreign keys (e.g., list of use cases, organization hierarchy).

### Namespaces
Logical isolation for different teams/services (e.g., platform, mbd, tsa).

### Templates
Pre-built schemas for common patterns (14+ templates available).

### Version History
Every configuration change is tracked for audit and rollback.

---

## Diagrams Overview

### System Architecture
```
[External Services] → [Config Service API] → [Database]
                              ↓
                        [Azure Key Vault]
```

### Data Model
```
Namespace → ConfigEntry ← ConfigSchema
              ↓
         ConfigHistory
```

### API Flow
```
User → UI → API → Validation → Database
                     ↓
               ConfigHistory
```

Full diagrams with details available in [Architecture](./architecture.md).

---

## Support & Contribution

- **Issues**: Report in GitHub repository
- **Questions**: Contact development team
- **Updates**: Check git log for latest changes

---

## Version

**Current Version**: 1.0  
**Last Updated**: 2025-11-27  
**Status**: Production Ready

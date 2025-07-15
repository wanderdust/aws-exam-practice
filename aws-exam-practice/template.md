# AWS Solutions Architect Associate Exam Question Generator Template

## Overview
Generate a set of practice questions for the AWS Certified Solutions Architect - Associate exam (SAA-C03) following this JSON structure. The questions should closely resemble the style, difficulty, and content of the official exam as described on the [AWS certification page](https://aws.amazon.com/certification/certified-solutions-architect-associate/).

## Question Types
Generate a mix of the following question types:

1. **Multiple Choice Questions**: Scenario-based questions with 4-5 options and only one correct answer
2. **Open-Ended Questions**: Concept questions with detailed explanations as answers

## JSON Structure Format

```json
[
  {
    "id": "unique-id-1",
    "type": "multiple-choice",
    "question": "Detailed scenario or question text",
    "options": [
      "Option A description",
      "Option B description",
      "Option C description",
      "Option D description"
    ],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why the answer is correct and why others are incorrect",
    "tags": ["EC2", "High Availability", "Auto Scaling"]
  },
  {
    "id": "unique-id-2",
    "type": "open-ended",
    "question": "Concept or architecture question requiring explanation",
    "answer": "Comprehensive answer with technical details and AWS best practices",
    "tags": ["VPC", "Security", "Network ACLs"]
  }
]
```

## Guidelines for Question Generation

### Content Focus Areas
Focus on these key domains from the exam blueprint:
- Design Resilient Architectures
- Design High-Performing Architectures
- Design Secure Applications and Architectures
- Design Cost-Optimized Architectures
- Design for Operational Excellence

### Question Quality
- Make scenarios realistic and representative of real-world challenges
- Include proper context for each question
- Ensure technical accuracy according to latest AWS documentation
- Focus on architecture decisions rather than memorization of limits or specific commands
- Use the correct AWS terminology and service names
- Include appropriate distractors for multiple-choice options that seem plausible but are incorrect

### Tags
Use tags that align with the AWS Certified Solutions Architect - Associate (SAA-C03) exam domains and key services. Each question should be tagged with at least one domain tag and relevant service tags.

### Exam Domain Tags
These tags reflect the core domains from the AWS exam guide:

- `Secure Architectures` (30% of exam) - Security, access control, data protection, encryption
- `Resilient Architectures` (26% of exam) - High availability, fault tolerance, disaster recovery
- `High-Performing Architectures` (24% of exam) - Scalability, performance optimization, efficient compute/storage/database/network
- `Cost-Optimized Architectures` (20% of exam) - Cost-effective resources, storage, compute, database, networking

### Core Service Tags
These tags represent the most important AWS services and concepts that appear on the exam:

#### Compute Services
- `EC2` - Elastic Compute Cloud, instance types, purchasing options
- `Lambda` - Serverless functions, event-driven architecture
- `Containers` - ECS, EKS, Fargate, container orchestration

#### Storage Services
- `S3` - Simple Storage Service, object storage, lifecycle policies
- `EBS` - Elastic Block Store, volume types, snapshots
- `EFS` - Elastic File System, file storage, shared access
- `Storage Gateway` - Hybrid storage integration

#### Database Services
- `RDS` - Relational Database Service, Multi-AZ, read replicas
- `Aurora` - Performance-optimized MySQL/PostgreSQL
- `DynamoDB` - NoSQL database, scaling, performance
- `ElastiCache` - In-memory caching, Redis, Memcached

#### Networking Services
- `VPC` - Virtual Private Cloud, subnets, routing, security
- `Route 53` - DNS, routing policies, domain registration
- `CloudFront` - Content delivery network, edge locations
- `ELB` - Elastic Load Balancing (ALB, NLB, GLB)
- `Direct Connect` - Dedicated network connections

#### Security Services
- `IAM` - Identity and Access Management, policies, roles
- `Cognito` - User authentication and authorization
- `WAF & Shield` - Web application firewall, DDoS protection
- `KMS` - Key Management Service, encryption
- `Secrets Manager` - Secure storage of secrets

#### Integration Services
- `SQS` - Simple Queue Service, message queues, decoupling
- `SNS` - Simple Notification Service, pub/sub messaging
- `API Gateway` - RESTful API management
- `Step Functions` - Serverless workflow orchestration

#### Management Services
- `CloudWatch` - Monitoring, logs, metrics, alarms
- `CloudTrail` - API activity tracking, compliance
- `Organizations` - Multi-account management, SCPs
- `Systems Manager` - Resource configuration, patching

#### Architecture Concepts
- `High Availability` - Multi-AZ deployments, fault isolation
- `Auto Scaling` - Dynamic resource adjustment
- `Disaster Recovery` - Backup/restore, pilot light, warm standby, multi-site
- `Microservices` - Decoupled application architecture
- `Serverless` - Lambda, event-driven design

## Examples to Follow
Include at least 30 questions per JSON file with a good mix of question types and topic areas. Each JSON file should focus on related services or concepts to allow for targeted practice.

Remember that the AWS Solutions Architect Associate exam tests the ability to select appropriate AWS services for various scenarios based on requirements, identify technically appropriate solutions, and apply AWS architectural best practices.

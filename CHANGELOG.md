# [0.2.0](https://github.com/labcabrera/rmu-api-users/compare/0.1.0...0.2.0) (2026-11-11)


* feat(friendship)!: friend requests by exact nick, invite links and a daily limit ([135a557](https://github.com/labcabrera/rmu-api-users/commit/135a55787a5f487ca657fef68f372855fee02d83))


### Bug Fixes

* **activation-codes:** make codes single-use and stop building RSQL from input ([16adfd3](https://github.com/labcabrera/rmu-api-users/commit/16adfd30299246cb3c0ce3f96d5c9d7d6979a714))
* add script that makes user display names unique ([246cc5b](https://github.com/labcabrera/rmu-api-users/commit/246cc5bda30baa28d43bfc5365b0f695dd2637ad))
* answer 200 to check and activate and 204 to deleting a code ([6dab2cf](https://github.com/labcabrera/rmu-api-users/commit/6dab2cf4ec5704aba53f00aef3b734900b81ae60))
* error path without query, health without security and event producer ([6f5ccd5](https://github.com/labcabrera/rmu-api-users/commit/6f5ccd57acba8ee1d103327a8423add56de1be2e))
* generate activation codes with crypto.randomInt and one limit ([feae5a3](https://github.com/labcabrera/rmu-api-users/commit/feae5a34c7124cda402e76c3f0e505ee68dde089))
* give friendships a state machine and reopen rejected requests ([a62944c](https://github.com/labcabrera/rmu-api-users/commit/a62944caa28b82e0759a3f9a3aeb0da9defeec67))
* guard friendships and messages with the permission model ([5713e7a](https://github.com/labcabrera/rmu-api-users/commit/5713e7a5c8a7a7b970a2b85bb77e9bd5833ba603))
* keep lastLoginAt out of the versioned profile writes ([12b69c8](https://github.com/labcabrera/rmu-api-users/commit/12b69c8ff90f529623347041f505a94f8c73cad4))
* let any rmu-admin manage every activation code ([1ed2964](https://github.com/labcabrera/rmu-api-users/commit/1ed2964a7d6e589fdff39bc3dbd25fef74ad6bb9))
* list the messages of the caller and combine q ([08d099f](https://github.com/labcabrera/rmu-api-users/commit/08d099fc0d401ebeaf5326137fa467745ccb7a6c))
* make marking a message as read idempotent ([6f50a9f](https://github.com/labcabrera/rmu-api-users/commit/6f50a9f64c206ba05dd6bee3d2c802e10e2062a8))
* make the activation code value unique across owners ([4ba336b](https://github.com/labcabrera/rmu-api-users/commit/4ba336b65e3d9e48ba9f33c688ef1da0520da27a))
* release an activation code when its date is cleared ([c4dbbeb](https://github.com/labcabrera/rmu-api-users/commit/c4dbbebfd6a5c215f35fad1e62774749450c8053))
* validate request bodies without implicit conversion ([f692c0b](https://github.com/labcabrera/rmu-api-users/commit/f692c0b3ed65b78b7a3f1049709c55e8beb55d90))


### Features

* add script that fills blockedBy on stored blocks ([49d3363](https://github.com/labcabrera/rmu-api-users/commit/49d336318490bddf98e67714932434736c9a42a1))
* adopt the api-core HTTP contract and repository (spec 020) ([49fe563](https://github.com/labcabrera/rmu-api-users/commit/49fe563e333a0a00cabc9e1bca88f8721f8d28cc))
* **auth:** validate issuer and audience of access tokens ([efb4426](https://github.com/labcabrera/rmu-api-users/commit/efb442676657d24e4299b87d98eb91881ea4f4b7))
* call Keycloak through the shared HttpClient with a timeout ([8d5c9b5](https://github.com/labcabrera/rmu-api-users/commit/8d5c9b5a68aad234e28ec9548bd4fa253387c533))
* **config:** validate env with Joi, read PORT and add a global ValidationPipe ([52df4c8](https://github.com/labcabrera/rmu-api-users/commit/52df4c8400b8187985385bdee0ddc19d0169f901))
* **friendship:** friendship between two users and friendship events ([4b372e4](https://github.com/labcabrera/rmu-api-users/commit/4b372e4e65868c4ea4118cac1eeddd7b936d8700))
* get /v1/info and admin /v1/stats ([a509186](https://github.com/labcabrera/rmu-api-users/commit/a509186f0461a89783d9b9413fc889ee9a749111))
* let either participant block a friendship and record blockedBy ([371c152](https://github.com/labcabrera/rmu-api-users/commit/371c1524f3663d9f4206927bc62a6cd496f81fb9))
* user administration and activation code fixes ([ee18084](https://github.com/labcabrera/rmu-api-users/commit/ee18084949d4d33f96963f8331615b9a62caab44))
* **user:** keep the friendships and invites in step with a new name ([afe8d43](https://github.com/labcabrera/rmu-api-users/commit/afe8d4372e50c31cc71c18b0434b613ae25b456e))
* **users:** provision profiles from token claims ([523c7d7](https://github.com/labcabrera/rmu-api-users/commit/523c7d729fc984a28dbff0fc93e19df73753831b))


### BREAKING CHANGES

* GET /v1/users/search is removed, and addresseeName no
longer accepts emails or Keycloak usernames of users without a profile.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

# Pricing Formula Configuration Implementation Summary

## Overview
Implemented a configurable pricing formula system that allows super administrators to modify pricing calculation parameters through a web interface. Changes take effect immediately on all new quotations without requiring code changes or deployments.

## Files Created/Modified

### Backend (NestJS)

#### 1. `server/modules/pricing-formula-config/pricing-formula-config.module.ts` (NEW)
- NestJS module definition
- Exports `PricingFormulaConfigService` for use by other modules (e.g., quotation engine)
- Registers controller and service

#### 2. `server/modules/pricing-formula-config/pricing-formula-config.controller.ts` (NEW)
- REST API endpoints for pricing formula configuration
- **Endpoints:**
  - `GET /api/pricing-formula-config` - Retrieve current configuration
  - `PATCH /api/pricing-formula-config` - Update configuration (super_admin only)
  - `POST /api/pricing-formula-config/reset` - Reset to defaults (super_admin only)
- Role-based access control using `@NeedLogin()` decorator and `req.userContext.roles` check

#### 3. `server/modules/pricing-formula-config/pricing-formula-config.service.ts` (NEW)
- Business logic for configuration management
- **Methods:**
  - `getConfig()` - Returns config_key='default' record, falls back to hardcoded defaults if not found
  - `updateConfig(configValue)` - Updates JSONB config_value field
  - `resetToDefault()` - Restores default configuration values
- Default values defined as `DEFAULT_CONFIG_VALUE` constant
- Includes comprehensive logging

#### 4. `server/modules/pricing-formula-config/dto/pricing-formula-config.dto.ts` (NEW)
- Data transfer object for update requests
- Defines `UpdatePricingFormulaConfigDto` with `configValue` field

#### 5. `server/modules/quotation/pricing-engine.ts` (MODIFIED)
- **Key Changes:**
  - Added import for `PricingFormulaValue` type
  - Added `DEFAULT_FORMULA_CONFIG` constant with all default values
  - **Config Loading (lines 32-47):**
    - Reads configuration from `pricingFormulaConfig` table at the start of `calculateQuotation()`
    - Falls back to defaults if read fails or config not found
    - Merges DB config with defaults to ensure all fields are present
  - **Config Extraction (lines 49-58):**
    - Extracts all config values with type conversion and fallbacks
    - Variables: `cfgGradeFactor`, `cfgSensitivityFactor`, `cfgLogisticsFactor`, `cfgInsuranceFactor`, `cfgCreditFactor`, `cfgQuantityFactor`, `cfgExchangeRiskRate`, `cfgDefaultTargetMargin`, `cfgFlexibleReserveRate`, `cfgTaxRate`
  - **Formula Integration:**
    - Line 92: `exchangeRiskRateVal = cfgExchangeRiskRate` (replaces DB read)
    - Line 93: `taxRateVal = cfgTaxRate` (replaces DB read)
    - Line 189: `targetMargin = cfgDefaultTargetMargin` (replaces hardcoded 0.30)
    - Line 243: `flexibleReserveRate = cfgFlexibleReserveRate` (replaces hardcoded 0)
    - Line 260: `gradeFactor = (gradeCoefficient || 1) * cfgGradeFactor` (applies config multiplier)
    - Line 261: `sensitivityFactor = (sensitivityCoefficient || 1) * cfgSensitivityFactor` (applies config multiplier)
    - Line 267: `logisticsCoefficient * cfgLogisticsFactor` (applies config multiplier)
    - Line 268: `insuranceCoefficientVal * cfgInsuranceFactor` (applies config multiplier)
    - Line 269: `creditCoefficient * cfgCreditFactor` (applies config multiplier)
    - Line 270: `quantityCoeff * cfgQuantityFactor` (applies config multiplier)
  - Line 359: Enhanced logging to include `formulaVersion`

### Frontend (React)

#### 6. `shared/pricing-formula-config.ts` (NEW)
- Shared TypeScript types between frontend and backend
- **Types:**
  - `PricingFormulaValue` - Configuration value structure with all 11 parameters
  - `PricingFormulaConfigResponse` - API response structure
  - `UpdatePricingFormulaConfigRequest` - Update request structure

#### 7. `client/src/api/pricing-formula-config.ts` (NEW)
- API client functions for frontend
- **Functions:**
  - `getPricingFormulaConfig()` - GET request wrapper
  - `updatePricingFormulaConfig(configValue)` - PATCH request wrapper
  - `resetPricingFormulaConfig()` - POST reset request wrapper
- Uses `axiosForBackend` with proper error handling

#### 8. `client/src/pages/PricingFormulaConfig/PricingFormulaConfig.tsx` (NEW)
- Main configuration page component
- **Features:**
  - Displays current formula version badge
  - Lists all 11 configurable parameters with Chinese labels and descriptions
  - Numeric input fields for each parameter
  - Visual indication of modified values (yellow "modified" badge)
  - Display of percentage values for rate parameters (e.g., 0.13 → 13.00%)
  - Save button (enabled only when changes detected, super_admin only)
  - Reset to defaults button with confirmation dialog (super_admin only)
  - Read-only mode for non-super_admin users (disabled inputs)
  - Loading and saving states with user feedback
  - Toast notifications for success/error states
- **Parameter Metadata:**
  - `gradeFactor` - Customer grade coefficient
  - `sensitivityFactor` - Price sensitivity coefficient
  - `logisticsFactor` - Logistics cost coefficient
  - `insuranceFactor` - Insurance coefficient
  - `creditFactor` - Credit condition coefficient
  - `quantityFactor` - Quantity discount coefficient
  - `exchangeRiskRate` - Exchange rate risk reserve rate
  - `defaultTargetMargin` - Default target margin rate
  - `flexibleReserveRate` - Flexible reserve rate
  - `taxRate` - Tax rate

### Pre-existing Files (Already Configured)

#### 9. `server/app.module.ts` (PRE-CONFIGURED)
- Already imports `PricingFormulaConfigModule`
- Already registered in imports array before `ViewModule`

#### 10. `client/src/app.tsx` (PRE-CONFIGURED)
- Already imports `PricingFormulaConfig` page component
- Already has route `/pricing-formula-config` with `super_admin` role protection

#### 11. `client/src/api/index.ts` (PRE-CONFIGURED)
- Already exports `pricingFormulaConfigApi` namespace

### Database

#### 12. `server/database/schema.ts` (AUTO-GENERATED)
- Contains `pricingFormulaConfig` table definition
- Fields: `id`, `configKey` (unique), `configValue` (JSONB), `description`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
- Default record with `config_key='default'` already seeded

## Configuration Parameters

| Parameter | Type | Default | Description | Applied In Formula |
|-----------|------|---------|-------------|-------------------|
| `formulaVersion` | string | "v1" | Version identifier | Logged only |
| `gradeFactor` | number | 1 | Customer grade multiplier | Step 4: `(gradeCoefficient \|\| 1) * cfgGradeFactor` |
| `sensitivityFactor` | number | 1 | Price sensitivity multiplier | Step 4: `(sensitivityCoefficient \|\| 1) * cfgSensitivityFactor` |
| `logisticsFactor` | number | 1 | Logistics cost multiplier | Step 5: `logisticsCoefficient * cfgLogisticsFactor` |
| `insuranceFactor` | number | 1 | Insurance cost multiplier | Step 5: `insuranceCoefficientVal * cfgInsuranceFactor` |
| `creditFactor` | number | 1 | Credit condition multiplier | Step 5: `creditCoefficient * cfgCreditFactor` |
| `quantityFactor` | number | 1 | Quantity discount multiplier | Step 5: `quantityCoeff * cfgQuantityFactor` |
| `exchangeRiskRate` | number | 0.02 | Exchange risk reserve rate | Step 2: Replaces DB read |
| `defaultTargetMargin` | number | 0.30 | Default target margin | Step 6: Replaces hardcoded 0.30 |
| `flexibleReserveRate` | number | 0 | Flexible reserve rate | Step 2: Fallback when `flexibleIsRate=false` |
| `taxRate` | number | 0.13 | Tax rate | Step 2: Replaces DB read |

## Formula Chain Integration

The pricing engine uses a 9-step formula chain. Configuration parameters are applied as follows:

1. **Base Cost** = `purchaseCost + rdCost` (no change)
2. **Total Reserve Rate** = `cfgExchangeRiskRate + afterSalesRate + marketingExpenseRate + flexibleReserveRate`
3. **Cost1** = `BaseCost / (1 - TotalReserveRate)` (no change)
4. **Cost2** = `Cost1 * ((gradeCoefficient || 1) * cfgGradeFactor) * ((sensitivityCoefficient || 1) * cfgSensitivityFactor)`
5. **Cost3** = `Cost2 * (1 + logisticsCoefficient * cfgLogisticsFactor) * (1 + insuranceCoefficientVal * cfgInsuranceFactor) * (1 + creditCoefficient * cfgCreditFactor) * quantityCoeff * cfgQuantityFactor`
6. **Unit Price** = `Cost3 / (1 - targetMargin)` where `targetMargin = cfgDefaultTargetMargin`
7. **Total Price** = `UnitPrice * quantity` (no change)
8. **Actual Margin** = `(UnitPrice - BaseCost) / UnitPrice` (no change)
9. **Alert Check** = Compare margin against thresholds (no change)

## Security & Access Control

### Backend
- All endpoints require authentication via `@NeedLogin()` decorator
- Update and reset endpoints check `req.userContext.roles.includes('super_admin')`
- Returns `403 Forbidden` for unauthorized access
- Read endpoint available to all authenticated users

### Frontend
- Route protected with `requiredRoles={['super_admin']}` in `app.tsx`
- UI disables all input fields for non-super_admin users
- Save and Reset buttons only visible to super_admin users
- Uses `useAppAuth()` hook to check `hasRole('super_admin')`

## Error Handling

### Backend
- `getConfig()`: Returns defaults if DB record not found (logs warning)
- `updateConfig()`: Throws `NotFoundException` if config record missing
- `resetToDefault()`: Throws `NotFoundException` if config record missing
- Pricing engine: Catches config read errors, falls back to defaults, logs warning

### Frontend
- Loading state with spinner/message
- Toast notifications for success/error states
- Disabled state during save/reset operations
- Confirmation dialog before reset operation

## Testing Scenarios

### Acceptance Criteria Verification

1. ✅ **Configuration display**: Page shows all 11 parameters with labels and current values
2. ✅ **Super admin edit**: Input fields enabled, Save button visible and functional
3. ✅ **Non-super-admin read-only**: Input fields disabled, Save/Reset buttons hidden
4. ✅ **Immediate effect**: Next quotation calculation uses updated config values
5. ✅ **Reset functionality**: Confirmation dialog, restores defaults, updates UI
6. ✅ **LSP clean**: No TypeScript errors in any modified files

### Test Cases

1. **Read Configuration**
   - GET `/api/pricing-formula-config` → Returns current config
   - Verify all 11 parameters present in response

2. **Update Configuration**
   - PATCH `/api/pricing-formula-config` with `{"configValue": {"gradeFactor": 1.2}}`
   - Verify response contains updated value
   - Calculate quotation → Verify `gradeFactor` applied

3. **Reset Configuration**
   - POST `/api/pricing-formula-config/reset`
   - Verify all values return to defaults
   - Calculate quotation → Verify default behavior

4. **Permission Checks**
   - Non-super-admin user attempts PATCH → 403 Forbidden
   - Non-super-admin user attempts POST reset → 403 Forbidden
   - Unauthenticated user → 401 Unauthorized

5. **Fallback Behavior**
   - Delete config record from DB
   - Calculate quotation → Should use hardcoded defaults, no errors
   - Verify warning logged

## Deployment Notes

- No database migrations required (table already exists)
- No environment variables required
- Configuration persists in database across deployments
- Default config seeded during initial setup
- Backward compatible: existing quotations unaffected (calculated at creation time)

## Maintenance

- To add new parameters:
  1. Add field to `PricingFormulaValue` interface in `shared/pricing-formula-config.ts`
  2. Add default value to `DEFAULT_CONFIG_VALUE` in service
  3. Add default value to `DEFAULT_FORMULA_CONFIG` in pricing-engine.ts
  4. Update `PARAM_META` array in frontend component
  5. Apply config value in pricing formula chain
  6. Update existing DB record with new field (optional, will use defaults)

- To modify formula logic:
  - Edit `server/modules/quotation/pricing-engine.ts`
  - Configuration parameters are applied as multipliers, formula structure unchanged
  - Test thoroughly before deployment

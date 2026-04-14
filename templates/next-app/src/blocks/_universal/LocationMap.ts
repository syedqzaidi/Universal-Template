import type { Block } from 'payload'

export const LocationMapBlock: Block = {
  slug: 'locationMap',
  interfaceName: 'LocationMapBlock',
  labels: { singular: 'Location Map', plural: 'Location Maps' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Our Service Area', localized: true },
    { name: 'embedUrl', type: 'text', admin: { description: 'Google Maps embed URL' } },
    { name: 'address', type: 'textarea', admin: { description: 'Physical address displayed alongside map' } },
    { name: 'serviceRadius', type: 'text', admin: { description: 'e.g., "25 miles from downtown"' } },
    { name: 'showNearbyLocations', type: 'checkbox', defaultValue: true },
  ],
}

/* This file was generated by upbc (the upb compiler) from the input
 * file:
 *
 *     envoy/api/v2/core/base.proto
 *
 * Do not edit -- your changes will be discarded when the file is
 * regenerated. */

#include <stddef.h>
#include "upb/msg.h"
#include "envoy/api/v2/core/base.upb.h"
#include "google/protobuf/any.upb.h"
#include "google/protobuf/struct.upb.h"
#include "google/protobuf/wrappers.upb.h"
#include "validate/validate.upb.h"
#include "gogoproto/gogo.upb.h"
#include "envoy/type/percent.upb.h"

#include "upb/port_def.inc"

static const upb_msglayout_field envoy_api_v2_core_Locality__fields[3] = {
  {1, UPB_SIZE(0, 0), 0, 0, 9, 1},
  {2, UPB_SIZE(8, 16), 0, 0, 9, 1},
  {3, UPB_SIZE(16, 32), 0, 0, 9, 1},
};

const upb_msglayout envoy_api_v2_core_Locality_msginit = {
  NULL,
  &envoy_api_v2_core_Locality__fields[0],
  UPB_SIZE(24, 48), 3, false,
};

static const upb_msglayout *const envoy_api_v2_core_Node_submsgs[2] = {
  &envoy_api_v2_core_Locality_msginit,
  &google_protobuf_Struct_msginit,
};

static const upb_msglayout_field envoy_api_v2_core_Node__fields[5] = {
  {1, UPB_SIZE(0, 0), 0, 0, 9, 1},
  {2, UPB_SIZE(8, 16), 0, 0, 9, 1},
  {3, UPB_SIZE(24, 48), 0, 1, 11, 1},
  {4, UPB_SIZE(28, 56), 0, 0, 11, 1},
  {5, UPB_SIZE(16, 32), 0, 0, 9, 1},
};

const upb_msglayout envoy_api_v2_core_Node_msginit = {
  &envoy_api_v2_core_Node_submsgs[0],
  &envoy_api_v2_core_Node__fields[0],
  UPB_SIZE(32, 64), 5, false,
};

static const upb_msglayout *const envoy_api_v2_core_Metadata_submsgs[1] = {
  &envoy_api_v2_core_Metadata_FilterMetadataEntry_msginit,
};

static const upb_msglayout_field envoy_api_v2_core_Metadata__fields[1] = {
  {1, UPB_SIZE(0, 0), 0, 0, 11, 3},
};

const upb_msglayout envoy_api_v2_core_Metadata_msginit = {
  &envoy_api_v2_core_Metadata_submsgs[0],
  &envoy_api_v2_core_Metadata__fields[0],
  UPB_SIZE(4, 8), 1, false,
};

static const upb_msglayout *const envoy_api_v2_core_Metadata_FilterMetadataEntry_submsgs[1] = {
  &google_protobuf_Struct_msginit,
};

static const upb_msglayout_field envoy_api_v2_core_Metadata_FilterMetadataEntry__fields[2] = {
  {1, UPB_SIZE(0, 0), 0, 0, 9, 1},
  {2, UPB_SIZE(8, 16), 0, 0, 11, 1},
};

const upb_msglayout envoy_api_v2_core_Metadata_FilterMetadataEntry_msginit = {
  &envoy_api_v2_core_Metadata_FilterMetadataEntry_submsgs[0],
  &envoy_api_v2_core_Metadata_FilterMetadataEntry__fields[0],
  UPB_SIZE(16, 32), 2, false,
};

static const upb_msglayout_field envoy_api_v2_core_RuntimeUInt32__fields[2] = {
  {2, UPB_SIZE(0, 0), 0, 0, 13, 1},
  {3, UPB_SIZE(4, 8), 0, 0, 9, 1},
};

const upb_msglayout envoy_api_v2_core_RuntimeUInt32_msginit = {
  NULL,
  &envoy_api_v2_core_RuntimeUInt32__fields[0],
  UPB_SIZE(16, 32), 2, false,
};

static const upb_msglayout_field envoy_api_v2_core_HeaderValue__fields[2] = {
  {1, UPB_SIZE(0, 0), 0, 0, 9, 1},
  {2, UPB_SIZE(8, 16), 0, 0, 9, 1},
};

const upb_msglayout envoy_api_v2_core_HeaderValue_msginit = {
  NULL,
  &envoy_api_v2_core_HeaderValue__fields[0],
  UPB_SIZE(16, 32), 2, false,
};

static const upb_msglayout *const envoy_api_v2_core_HeaderValueOption_submsgs[2] = {
  &envoy_api_v2_core_HeaderValue_msginit,
  &google_protobuf_BoolValue_msginit,
};

static const upb_msglayout_field envoy_api_v2_core_HeaderValueOption__fields[2] = {
  {1, UPB_SIZE(0, 0), 0, 0, 11, 1},
  {2, UPB_SIZE(4, 8), 0, 1, 11, 1},
};

const upb_msglayout envoy_api_v2_core_HeaderValueOption_msginit = {
  &envoy_api_v2_core_HeaderValueOption_submsgs[0],
  &envoy_api_v2_core_HeaderValueOption__fields[0],
  UPB_SIZE(8, 16), 2, false,
};

static const upb_msglayout_field envoy_api_v2_core_DataSource__fields[3] = {
  {1, UPB_SIZE(0, 0), UPB_SIZE(-9, -17), 0, 9, 1},
  {2, UPB_SIZE(0, 0), UPB_SIZE(-9, -17), 0, 12, 1},
  {3, UPB_SIZE(0, 0), UPB_SIZE(-9, -17), 0, 9, 1},
};

const upb_msglayout envoy_api_v2_core_DataSource_msginit = {
  NULL,
  &envoy_api_v2_core_DataSource__fields[0],
  UPB_SIZE(16, 32), 3, false,
};

static const upb_msglayout *const envoy_api_v2_core_TransportSocket_submsgs[2] = {
  &google_protobuf_Any_msginit,
  &google_protobuf_Struct_msginit,
};

static const upb_msglayout_field envoy_api_v2_core_TransportSocket__fields[3] = {
  {1, UPB_SIZE(0, 0), 0, 0, 9, 1},
  {2, UPB_SIZE(8, 16), UPB_SIZE(-13, -25), 1, 11, 1},
  {3, UPB_SIZE(8, 16), UPB_SIZE(-13, -25), 0, 11, 1},
};

const upb_msglayout envoy_api_v2_core_TransportSocket_msginit = {
  &envoy_api_v2_core_TransportSocket_submsgs[0],
  &envoy_api_v2_core_TransportSocket__fields[0],
  UPB_SIZE(16, 32), 3, false,
};

static const upb_msglayout_field envoy_api_v2_core_SocketOption__fields[6] = {
  {1, UPB_SIZE(24, 24), 0, 0, 9, 1},
  {2, UPB_SIZE(0, 0), 0, 0, 3, 1},
  {3, UPB_SIZE(8, 8), 0, 0, 3, 1},
  {4, UPB_SIZE(32, 40), UPB_SIZE(-41, -57), 0, 3, 1},
  {5, UPB_SIZE(32, 40), UPB_SIZE(-41, -57), 0, 12, 1},
  {6, UPB_SIZE(16, 16), 0, 0, 14, 1},
};

const upb_msglayout envoy_api_v2_core_SocketOption_msginit = {
  NULL,
  &envoy_api_v2_core_SocketOption__fields[0],
  UPB_SIZE(48, 64), 6, false,
};

static const upb_msglayout *const envoy_api_v2_core_RuntimeFractionalPercent_submsgs[1] = {
  &envoy_type_FractionalPercent_msginit,
};

static const upb_msglayout_field envoy_api_v2_core_RuntimeFractionalPercent__fields[2] = {
  {1, UPB_SIZE(8, 16), 0, 0, 11, 1},
  {2, UPB_SIZE(0, 0), 0, 0, 9, 1},
};

const upb_msglayout envoy_api_v2_core_RuntimeFractionalPercent_msginit = {
  &envoy_api_v2_core_RuntimeFractionalPercent_submsgs[0],
  &envoy_api_v2_core_RuntimeFractionalPercent__fields[0],
  UPB_SIZE(16, 32), 2, false,
};

#include "upb/port_undef.inc"

